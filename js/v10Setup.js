(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeV10Setup=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // JOB-26 (G-13 part 2c): Team V's look (pinned 5e05a1f) on the most fragile screens: Start/Join (createShowdown)
  // and the League wheel (the Club packs moved to Team V's full Club Assignment in job 34: js/clubScreenV10.js).
  // SKIN ONLY. This file never writes product text, never sets disabled/hidden,
  // never adds click handlers to product controls and never removes or moves a product node. It adds one class to the
  // screen, one html data attribute, decorative aria-hidden art, and highlight classes that follow the result the
  // product code has already shown (which comes from the shared Setup provider). The animation shows, it never picks.
  const BASE="visual-assets/v10_1/";
  const EVENT="career-mode-screen-shown";
  const STYLE=Object.freeze(["v10-setup-ui","css/v10Setup.css"]);
  const SKIN_CLASS="v26Skin";
  const HTML_ATTR="v10Setup";
  const SCREENS=Object.freeze({createShowdown:"start",leagueWheelScreen:"league"});
  // Phone heroes per screen (Team V phone art). Desktop uses the plates through css/v10Setup.css.
  const HEROES=Object.freeze({
    start:Object.freeze({daniel:"start-join/assets/OVL_SJ_DANIEL_PHONE_V1.webp",nik:"start-join/assets/OVL_SJ_NIK_PHONE_V1.webp"}),
    league:Object.freeze({daniel:"league/assets/OVL_LEAGUE_DANIEL_PHONE_V1.webp",nik:"league/assets/OVL_LEAGUE_NIK_PHONE_V1.webp"})
  });
  // Every id start-join/TRUTH.md (5e05a1f) says must survive, plus the wheel and pack ids product code and the
  // two-manager browser journey read. The contract checks they still exist after a mount.
  const TRUTH_IDS=Object.freeze(["newShowdown","createShowdown","createShowdownScreenTitle","showdownName","managerOne","managerTwo","roundAmount","onlineShowdownSetupNote","onlinePlayerIdentityOverlay","onlinePlayerIdentityBadge","onlinePlayerIdentitySettingsPanel","startShowdown","productionSharedJourneyEntryOverlay","startSharedShowdown","continueSharedSetupGate","sharedJourneyLeagueLockNote","spinLeague","openClubPack","persistentNikDanielPairPanel","persistentNikDanielPairCode","sparkRemoteJoiningOverlay","settingsContent","settingsOverlay","sparkConnectedAccountPanel","sparkPrivatePairingPanel","sparkPrivatePairingCodeInput"]);
  const SETUP_IDS=Object.freeze(["leagueWheelScreen","leagueWheel","selectedLeague","leagueStateNote","spinLeague","clubWheelScreen","clubAssignmentLeague","clubPackStatus","clubCardOne","clubCardTwo","clubPlayerOne","clubPlayerTwo","clubNameOne","clubNameTwo","clubCardStateOne","clubCardStateTwo","clubRivalryConfirmation","openClubPack","continueClubAssignment","clubAssignmentBack","createShowdown","roundAmount","startShowdown"]);
  // data/leagues.js order and names; used only when the app's own leagues list is not in scope (Node contract).
  const LEAGUES=Object.freeze([["premier_league","Premier League"],["laliga","LaLiga"],["bundesliga","Bundesliga"],["serie_a","Serie A"],["ligue_1","Ligue 1"]].map(([id,name])=>Object.freeze({id,name})));
  const SPIN_FALLBACK_MS=4300;

  // ---- pure helpers (the contract runs these directly) ----
  function v26LeagueList(){
    try{if(typeof leagues!=="undefined"&&Array.isArray(leagues)&&leagues.length)return leagues;}catch(_error){}
    return LEAGUES;
  }
  const v26Norm=value=>String(value==null?"":value).replace(/\s+/g," ").trim().toLowerCase();
  // The league the product is showing in #selectedLeague, or null for any non-result text ("Spin to select league",
  // "SPINNING...", "Shared league wheel ready", ...). Never guesses: only an exact league name counts.
  function v26LeagueFromText(text,list=v26LeagueList()){
    const shown=v26Norm(text);
    if(!shown)return null;
    const hit=list.find(league=>league&&(v26Norm(league.name)===shown||v26Norm(league.id)===shown));
    return hit?hit.id:null;
  }
  function v26LeagueIdForItem(text,list=v26LeagueList()){return v26LeagueFromText(text,list);}
  // Index of the wheel item under the fixed pointer for an inline "rotate(Xdeg)" transform (items sit every 72deg,
  // item i at i*72deg, and the app rotates the track by -index*72 to bring a league to the top). Null when unknown.
  function v26TopIndex(transform,count=5){
    const match=/rotate\(\s*(-?\d+(?:\.\d+)?)deg\s*\)/.exec(String(transform||""));
    if(!match||!count)return null;
    const step=360/count,angle=((Number(match[1])%360)+360)%360;
    return ((count-Math.round(angle/step))%count+count)%count;
  }
  // The clubs the product has revealed on the two packs (Daniel left/playerOne, Nik right/playerTwo), or null per side
  // while that pack is still sealed. Read from the product's own DOM state only. (Pure helper; the Club screen's look
  // is js/clubScreenV10.js since job 34.)
  function v26PackResult(cardOne,nameOne,cardTwo,nameTwo){
    const side=(card,name)=>{
      const text=name?String(name.textContent||"").trim():"";
      return card&&card.classList&&card.classList.contains("is-revealed")&&text&&text!=="?"?text:null;
    };
    return Object.freeze({playerOne:side(cardOne,nameOne),playerTwo:side(cardTwo,nameTwo)});
  }

  // ---- browser binding ----
  const v26Doc=()=>root.document||null;
  const v26Byid=id=>{const doc=v26Doc();return doc?doc.getElementById(id):null;};
  const v26Screens=()=>root.CareerModeV10Screens||null;
  const FRAMES=Object.freeze(Object.fromEntries(Object.entries(SCREENS).map(([id,skin])=>[id,Object.freeze({screen:id,skin})])));
  const live=new Map();
  let installed=false,lastShown=null,screenObserver=null;

  function v26Report(context,error){
    if(root.console&&typeof root.console.warn==="function")root.console.warn(`[Career Mode Showdown] ${context}`,error);
  }
  function v26Reduced(){
    try{
      if(root.ShowdownMotion&&typeof root.ShowdownMotion.isReducedMotion==="function")return root.ShowdownMotion.isReducedMotion();
      if(typeof root.isReducedMotionPreferred==="function")return root.isReducedMotionPreferred();
      return typeof root.matchMedia==="function"&&root.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }catch(_error){return false;}
  }
  function v26Make(tag,className){const node=v26Doc().createElement(tag);if(className)node.className=className;node.setAttribute("aria-hidden","true");node.dataset.v26Decor="true";return node;}
  // Decorative phone art: <picture> with a phone-only source, so desktop downloads nothing (the plate is the desktop art).
  function v26Art(skin){
    const art=v26Make("div","v26Art v26Art--"+skin);
    for(const who of ["daniel","nik"]){
      const picture=v26Make("picture","v26Hero v26Hero--"+who),source=v26Doc().createElement("source"),img=v26Doc().createElement("img");
      source.setAttribute("media","(max-width: 900px)");source.setAttribute("srcset",BASE+HEROES[skin][who]);source.setAttribute("type","image/webp");
      img.setAttribute("alt","");img.setAttribute("decoding","async");
      picture.appendChild(source);picture.appendChild(img);art.appendChild(picture);
    }
    return art;
  }
  function v26Observe(state,target,options,fn){
    if(!target||typeof root.MutationObserver!=="function")return;
    const observer=new root.MutationObserver(()=>{try{fn();}catch(error){v26Report("Team V setup skin could not update.",error);}});
    observer.observe(target,options);state.observers.push(observer);
  }
  function v26Later(state,fn,ms){const timer=root.setTimeout(()=>{state.timers.delete(timer);fn();},ms);state.timers.add(timer);return timer;}

  // League wheel: original league marks on the items, the item under the pointer, and the winner payoff once the
  // product has shown the result and the wheel has stopped.
  function v26LeagueParts(){
    const wheel=v26Byid("leagueWheel"),track=wheel?wheel.querySelector(".wheelTrack"):null;
    return {wheel,track,items:track?Array.from(track.querySelectorAll(".wheelItem")):[],result:v26Byid("selectedLeague")};
  }
  const v26Animating=track=>Boolean(track&&track.dataset&&track.dataset.leagueWheelAnimating==="true");
  function v26Marks(items){
    if(typeof root.applyLeagueMark!=="function")return;
    for(const item of items){
      const id=v26LeagueIdForItem(item.textContent);
      if(id&&item.dataset.leagueMark!=="original")root.applyLeagueMark(item,id);
    }
  }
  function v26Payoff(state,wheel,winner){
    if(v26Reduced()||!wheel)return;
    let flash=wheel.querySelector(".v26Flash"),canvas=wheel.querySelector(".v26Burst");
    if(!flash){flash=v26Make("span","v26Flash");wheel.appendChild(flash);}
    if(!canvas){canvas=v26Make("canvas","v26Burst");wheel.appendChild(canvas);}
    flash.classList.remove("is-active");void flash.offsetWidth;flash.classList.add("is-active");
    if(winner)winner.classList.add("v26-payoff");
    v26Later(state,()=>{flash.classList.remove("is-active");if(winner)winner.classList.remove("v26-payoff");},620);
    if(typeof root.sdBurst==="function"&&typeof canvas.getBoundingClientRect==="function"){
      const box=canvas.getBoundingClientRect();
      if(box.width){canvas.width=Math.round(box.width);canvas.height=Math.round(box.height);root.sdBurst(canvas,box.width/2,box.height*.16,{count:42,duration:700,spread:Math.PI*1.35,speedMin:95,speedMax:270}).catch(()=>{});}
    }
  }
  function v26SyncLeague(state){
    const {wheel,track,items,result}=v26LeagueParts();
    if(!wheel||!track)return;
    v26Marks(items);
    const host=state.host,animating=v26Animating(track);
    host.classList.toggle("v26-spinning",animating);
    const top=animating?null:v26TopIndex(track.style.transform,items.length);
    items.forEach((item,index)=>item.classList.toggle("v26-top",index===top));
    const leagueId=v26LeagueFromText(result?result.textContent:"");
    if(!leagueId){
      state.shownLeague=null;state.sawSpin=state.sawSpin||animating||/SPINNING/i.test(result?result.textContent:"");
      items.forEach(item=>item.classList.remove("v26-selected"));
      delete host.dataset.v26League;
      return;
    }
    // Wait for the result: while the wheel still turns towards it, nothing is highlighted.
    if(animating){state.sawSpin=true;return;}
    const winner=items.find(item=>v26LeagueIdForItem(item.textContent)===leagueId)||null;
    items.forEach(item=>item.classList.toggle("v26-selected",item===winner));
    host.dataset.v26League=leagueId;
    if(state.shownLeague!==leagueId){
      const fresh=state.sawSpin;state.shownLeague=leagueId;state.sawSpin=false;
      if(fresh)v26Payoff(state,wheel,winner);
    }
  }
  function v26BindLeague(state){
    const {track,result}=v26LeagueParts(),sync=()=>v26SyncLeague(state);
    v26Observe(state,result,{childList:true,characterData:true,subtree:true},sync);
    v26Observe(state,track,{attributes:true,attributeFilter:["style","data-league-wheel-animating"]},sync);
    if(track){
      const ended=event=>{if(event.target===track)sync();};
      track.addEventListener("transitionend",ended);state.cleanups.push(()=>track.removeEventListener("transitionend",ended));
    }
    // The shared wheel turns for 4 s and the app then disarms it; this is only a safety net if transitionend is lost.
    v26Observe(state,track,{attributes:true,attributeFilter:["data-league-wheel-animating"]},()=>{if(v26Animating(track))v26Later(state,sync,SPIN_FALLBACK_MS);});
    sync();
  }

  function v26Mount(frame,host){
    const doc=v26Doc();
    if(!frame||!host||!doc)return;
    v26Unmount(host);
    const state={host,skin:frame.skin,observers:[],timers:new Set(),cleanups:[],shownLeague:null,sawSpin:false};
    live.set(host,state);
    host.classList.add(SKIN_CLASS);
    doc.documentElement.dataset[HTML_ATTR]=frame.skin;
    if(!host.querySelector(":scope > .v26Art"))host.appendChild(v26Art(frame.skin));
    if(frame.skin==="league")v26BindLeague(state);
  }
  function v26Unmount(host){
    const state=host?live.get(host):null;
    if(state){
      live.delete(host);
      state.observers.forEach(observer=>observer.disconnect());
      state.timers.forEach(timer=>root.clearTimeout(timer));
      state.cleanups.forEach(fn=>{try{fn();}catch(_error){}});
      const doc=v26Doc();
      if(doc&&doc.documentElement.dataset[HTML_ATTR]===state.skin)delete doc.documentElement.dataset[HTML_ATTR];
    }
    if(!host)return;
    host.classList.remove(SKIN_CLASS,"v26-spinning");
    delete host.dataset.v26League;
    Array.from(host.querySelectorAll("[data-v26-decor]")).forEach(node=>{if(node.parentNode)node.parentNode.removeChild(node);});
    Array.from(host.querySelectorAll(".v26-top,.v26-selected,.v26-payoff")).forEach(node=>node.classList.remove("v26-top","v26-selected","v26-payoff"));
  }

  // Some product paths show a screen by toggling classes directly (the shared presentation forces the wheels), which
  // skips showScreen and so the loader's screen event. One class observer on the screens repeats that event for them,
  // so the skin mounts and the top bar paints its "setup" lock exactly as after showScreen.
  function v26ActiveScreen(){
    try{if(typeof root.getActiveScreenName==="function")return root.getActiveScreenName()||null;}catch(_error){}
    return null;
  }
  function v26AnnounceScreen(){
    const doc=v26Doc(),screen=v26ActiveScreen();
    if(!doc||!screen||screen===lastShown||typeof root.CustomEvent!=="function")return false;
    doc.dispatchEvent(new root.CustomEvent(EVENT,{detail:{screen}}));
    return true;
  }
  function v26WatchScreens(){
    const doc=v26Doc();
    if(!doc||screenObserver||typeof root.MutationObserver!=="function")return;
    let queued=false;
    screenObserver=new root.MutationObserver(()=>{
      if(queued)return;queued=true;
      Promise.resolve().then(()=>{queued=false;try{v26AnnounceScreen();}catch(error){v26Report("Team V setup skin could not follow the screen.",error);}});
    });
    Array.from(doc.querySelectorAll("main > .screen")).forEach(section=>screenObserver.observe(section,{attributes:true,attributeFilter:["class"]}));
  }

  function v26Install(){
    const screens=v26Screens(),doc=v26Doc();
    if(installed||!screens||!doc)return api;
    installed=true;
    if(typeof root.loadRuntimeStyle==="function")root.loadRuntimeStyle(STYLE[0],STYLE[1]).catch(error=>v26Report("Team V setup styles unavailable.",error));
    doc.addEventListener(EVENT,event=>{lastShown=event&&event.detail?event.detail.screen||null:null;});
    for(const id of Object.keys(SCREENS)){
      screens.register(id,{css:[],js:[],frame:()=>FRAMES[id],mount:(frame,host)=>v26Mount(frame,host),unmount:host=>v26Unmount(host)});
    }
    v26WatchScreens();
    const current=v26ActiveScreen();
    if(current){lastShown=null;v26AnnounceScreen();}
    return api;
  }

  const api=Object.freeze({
    contractVersion:1,BASE,EVENT,STYLE,SCREENS,HEROES,TRUTH_IDS,SETUP_IDS,SKIN_CLASS,
    leagueFromText:v26LeagueFromText,topIndex:v26TopIndex,packResult:v26PackResult,
    install:v26Install,mount:v26Mount,unmount:v26Unmount,syncLeague:host=>{const state=live.get(host);if(state)v26SyncLeague(state);},
    announceScreen:v26AnnounceScreen
  });
  return api;
});
