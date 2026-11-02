(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeHomeScreensV10=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // JOB-25 (G-13 part 2b): Team V's Home (factory/v1-wtt5ye 5e05a1f) drawn around the app's own #mainMenu, plus
  // Nik's Audius playlist (home/soundtrack.js). Skin, don't rewire: every product button keeps its node, id, text
  // and listeners. This file only adds art, wrappers and classes; css/homeV10.css maps Team V's layout onto the
  // real DOM. Loading stays the app's startup splash (it shows before any lazy code can load).
  const BASE="visual-assets/v10_1/";
  const FRAME=Object.freeze({skin:"team-v-home-5e05a1f"});
  // Nik's locked Audius top 10, in his order (owner request 2026-10-10, JOB-1591; ids resolved on api.audius.co 2026-10-11;
  // owner swap 2026-10-12: In Da Club (San Holo Remix) replaces Tabestoon Kootahe, Fresh replaces Dideh o Del).
  // Never swap, drop or add a song without Nik's words; an unplayable id shows the stream error and plays nothing else.
  // r87 (Nik 2026-11-01): Home has no music strip; the player is the phone MUSIC tab and the desktop top-bar dock.
  const MEDIA=Object.freeze({
    // Owner request 2026-10-27 (FIFA/PES handoff): Song 2 opens the game, Love Me Again second, the other new picks next with
    // the two Sweet Disposition versions apart, then the earlier ten in their order. Ids resolved on api.audius.co 2026-10-27.
    tracks:Object.freeze([
      Object.freeze({key:"song2",title:"SONG 2",artist:"Blur",audiusTrackId:"6R99GRQ"}),
      Object.freeze({key:"loveMeAgain",title:"LOVE ME AGAIN",artist:"John Newman",audiusTrackId:"GNQJ5dl"}),
      Object.freeze({key:"kids",title:"KIDS (TUNA MELT REMIX)",artist:"MGMT",audiusTrackId:"5xdlPEJ"}),
      Object.freeze({key:"sweetDispositionTeo",title:"SWEET DISPOSITION",artist:"The Temper Trap",audiusTrackId:"K9J0w8l"}),
      Object.freeze({key:"alive",title:"ALIVE",artist:"Empire of the Sun",audiusTrackId:"Nvydpr7"}),
      Object.freeze({key:"theNights",title:"THE NIGHTS (MASHUP)",artist:"Avicii",audiusTrackId:"WGNNo"}),
      Object.freeze({key:"aiSeEuTePego",title:"AI SE EU TE PEGO",artist:"Michel Teló",audiusTrackId:"PQ28va7"}),
      Object.freeze({key:"shelter",title:"SHELTER (TRANTIC REMIX)",artist:"Porter Robinson & Madeon",audiusTrackId:"3mjjB"}),
      Object.freeze({key:"sweetDispositionBlazy",title:"SWEET DISPOSITION (REMIX)",artist:"The Temper Trap",audiusTrackId:"y7Z9P"}),
      Object.freeze({key:"business",title:"BUSINESS",artist:"Behzad Leito ft. Sepehr Khalse, Saman Wilson, Sohrab MJ & Alireza JJ",audiusTrackId:"Ymgov"}),
      Object.freeze({key:"inDaClub",title:"IN DA CLUB (SAN HOLO REMIX)",artist:"50 Cent & San Holo",audiusTrackId:"qZ17b"}),
      Object.freeze({key:"sarnevesht",title:"SARNEVESHT",artist:"Gdaal & Imanemun ft. Erfan & Madgal",audiusTrackId:"gb33l"}),
      Object.freeze({key:"nextToYou",title:"NEXT TO YOU",artist:"RAC ft. Emerson Leif",audiusTrackId:"n1zqQ"}),
      Object.freeze({key:"hateItOrLoveIt",title:"HATE IT OR LOVE IT (JERSEY CLUB)",artist:"MIKE GIP",audiusTrackId:"ygyOr"}),
      Object.freeze({key:"banafsh",title:"BANAFSH",artist:"Gdaal ft. Madgal",audiusTrackId:"3RaaM"}),
      Object.freeze({key:"fresh",title:"FRESH",artist:"Sijal ft. Sepehr Khalse, Behzad Leito & Mehrad Hidden",audiusTrackId:"AV9dv"}),
      Object.freeze({key:"yakuza",title:"YAKUZA",artist:"Sepehr Khalse",audiusTrackId:"ryBXG"}),
      Object.freeze({key:"nasty",title:"NASTY",artist:"grouptherapy.",audiusTrackId:"G5rXAWE"}),
      Object.freeze({key:"cheraBadi",title:"CHERA BADI",artist:"Zedbazi ft. Hichkas",audiusTrackId:"0dGWK"})
    ]),
    defaultTrack:"song2",
    audius:Object.freeze({apiBase:"https://api.audius.co/v1",appName:"CareerModeShowdown17"})
  });
  // Continue shows Team V's number-17 player (owner, 2026-10-05); css/homeV10.css hides the old Reus cover on this Home.
  // Nik, 2026-10-05: Home shows all seven of Team V's tiles, so Legacy and Statistics are no longer contained.
  const TILE_ART=Object.freeze({
    continueCareer:"TILE_CONTINUE_V1.webp",newShowdown:"TILE_TACTICS_V1.webp",legacyButton:"TILE_HISTORY_V1.webp",careerStatisticsButton:"TILE_STATISTICS_V1.webp",
    ruleBookButton:"TILE_RULEBOOK_V1.webp",settingsButton:"TILE_SETTINGS_V1.webp"
  });
  // The seventh tile, Trophy Room, as in Team V's Home frame (home/index.html at 5e05a1f). The product has no Home
  // button for it, so this Home adds one that opens the product's own Trophy Room route. Its id is not Team V's
  // #trophyRoomButton, because Career Statistics already owns that id.
  const TROPHY_TILE=Object.freeze({id:"homeTrophyRoomButton",after:"careerStatisticsButton",code:"HONOURS",label:"TROPHY ROOM",
    meta:"Career trophies, standings and records",art:"shared/trophies/TRO_LEAGUE_TITLE_V1_512.webp"});
  const CHEVRON='<svg class="tileChevron" aria-hidden="true" focusable="false" viewBox="0 0 12 20"><path d="M2 2l8 8-8 8" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const HOME_CSS=Object.freeze(["home/home.css","../../css/homeV10.css"]);
  const PANEL_CLASSES=tile=>tile.id==="continueCareer"?["sd-panel","sd-panel--hero"]:["sd-panel"];
  let registered=null;

  const hmDoc=()=>root.document;
  function hmEl(tag,className,html){const el=hmDoc().createElement(tag);if(className)el.className=className;if(html)el.innerHTML=html;return el;}
  function hmDecor(className,html){const el=hmEl("div",className,html);el.setAttribute("aria-hidden","true");return el;}

  // Team V's stage layers (index.html at 5e05a1f), all decorative.
  function hmScene(){
    const pic=(cls,file,extra)=>`<picture class="${cls}"${extra||""}><source media="(max-width: 760px) and (orientation: portrait), (max-width: 900px) and (max-height: 480px) and (orientation: landscape)" srcset="${BASE}${file}" type="image/webp"><img alt="" decoding="async"></picture>`;
    const frag=hmDoc().createDocumentFragment();
    // r78 HO-031: the phone plate is Team V's marble ENV_HOME_PHONE_V2 with both managers painted in, so the phone
    // cut-out layer (OVL_HOME_*_PHONE_V2) is gone.
    frag.append(
      hmDecor("plateView",pic("phoneHeroBackground","plates-v2/ENV_HOME_PHONE_V2.webp")+'<div class="plateLayer"></div>'),
      hmDecor("phoneHeroGrade"),hmDecor("scrim scrimTop"),hmDecor("scrim scrimLow"),hmDecor("dockBed"),
      hmDecor("scriptLine","<span>More Than A Game</span>")
    );
    return frag;
  }
  function hmLockup(){
    return hmEl("div","homeLockup",'<p class="lockupKicker sd-label" aria-hidden="true">THE SHOWDOWN STARTS HERE</p><div class="lockupWordmarkWrap sd-title sd-title--wordmark"><span class="sd-visually-hidden">CAREER MODE SHOWDOWN 17</span><img class="lockupWordmark" src="'+BASE+'home/assets/LOGO_CM17_WORDMARK_V1.webp" alt="" aria-hidden="true" width="1040" height="378" decoding="async"></div><p class="lockupLegacy sd-tagline" aria-hidden="true">TWO MANAGERS · ONE LEGACY</p>');
  }
  function hmTile(id,file,path){
    const button=hmDoc().getElementById(id);
    if(!button)return;
    if(!button.querySelector(".tileArt")){
      const img=hmEl("img","tileArt");img.src=BASE+(path||"shared/art/home-tiles/"+file);img.alt="";img.setAttribute("aria-hidden","true");img.decoding="async";
      button.appendChild(img);
    }
    if(!button.querySelector(".tileChevron"))button.insertAdjacentHTML("beforeend",CHEVRON);
  }

  function hmTrophyTile(grid){
    const t=TROPHY_TILE;
    if(hmDoc().getElementById(t.id))return;
    const anchor=hmDoc().getElementById(t.after);
    const button=hmEl("button","menuTile menuTileTrophyRoom",'<span class="menuTileCode">'+t.code+'</span><span class="menuTileLabel">'+t.label+'</span><span class="menuTileMeta">'+t.meta+'</span>');
    button.id=t.id;button.type="button";button.dataset.routeKey="trophyRoom";
    button.addEventListener("click",()=>{if(typeof root.openOptionalModule==="function")root.openOptionalModule("trophyRoom");});
    if(anchor&&anchor.parentNode===grid)anchor.insertAdjacentElement("afterend",button);else grid.appendChild(button);
    hmTile(t.id,null,t.art);
  }

  // The soundtrack (home/soundtrack.js) and its player (js/musicDockV10.js: phone MUSIC tab, desktop top-bar dock) start once
  // the app has started, whatever screen it opens on (HE-06: a reload straight onto the league wheel used to have no player
  // until Home was drawn). Home itself has no music strip (Nik, 2026-11-01).
  let hmMusicStarted=null;
  function hmStartMusic(){
    if(hmMusicStarted)return hmMusicStarted;
    const load=root.loadRuntimeScript;
    if(typeof load!=="function")return Promise.resolve(false);
    hmMusicStarted=Promise.resolve(load("v10-home-soundtrack",BASE+"home/soundtrack.js",()=>Boolean(root.HomeSoundtrack)))
      .then(()=>{if(!root.HomeSoundtrack)return false;if(!root.HomeSoundtrack.current())root.HomeSoundtrack.init(MEDIA);
        return Promise.resolve(load("v10-music-dock","js/musicDockV10.js",()=>Boolean(root.CareerModeMusicDockV10))).then(()=>root.CareerModeMusicDockV10?.start());})
      .catch(()=>{hmMusicStarted=null;return false;});
    return hmMusicStarted;
  }

  const HM_PHONE_QUOTA="(max-width: 760px) and (orientation: portrait)",HM_PHONE_QUOTA_LINE="Online limit used up today · back at 3 am Boston";
  function hmQuotaNotice(){
    const doc=hmDoc(),budget=root.CareerModeFirestoreBudget,message=budget?.quotaMessage?.(),home=doc?.getElementById("mainMenu");
    // r87 (Nik's pick): on a portrait phone the floating note covered both faces, so the limit is one short line inside
    // the Continue Career tile instead; every other size keeps the note.
    const tile=doc?.getElementById("continueCareer"),phone=root.matchMedia?.(HM_PHONE_QUOTA)?.matches===true;
    let line=tile?.querySelector?.(".menuTileQuota");
    if(message&&phone&&tile&&root.getActiveScreenName?.()==="mainMenu"&&!home?.closest?.("[inert]")){
      const notice=doc.getElementById("appRuntimeNotice");
      if(notice&&(notice.dataset.homeQuota||notice.querySelector(".runtimeNoticeText")?.textContent===budget.quotaMessageText))notice.remove();
      if(!line){line=doc.createElement("span");line.className="menuTileQuota";tile.append(line);}
      line.textContent=HM_PHONE_QUOTA_LINE;return;
    }
    line?.remove();
    if(message&&root.getActiveScreenName?.()==="mainMenu"&&!home?.closest?.("[inert]")){
      root.showAppNotice?.(message,"error",0);
      const notice=doc?.getElementById("appRuntimeNotice");
      if(notice&&home?.parentNode){notice.dataset.homeQuota="1";if(notice.parentNode!==home)home.appendChild(notice);}
    }else{
      const notice=doc?.getElementById("appRuntimeNotice");
      if(budget&&notice?.querySelector(".runtimeNoticeText")?.textContent===budget.quotaMessageText)notice.remove();
      else if(notice?.dataset.homeQuota){delete notice.dataset.homeQuota;doc.body.appendChild(notice);}
    }
  }

  function hmDecorate(frame,host){
    const shell=host.querySelector(".fifaMenuShell"),heading=host.querySelector(".fifaMenuHeading"),grid=host.querySelector(".fifaMenuGrid");
    if(!shell||!heading||!grid)return false;
    if(host.dataset.homeV10!=="1"){
      host.dataset.homeV10="1";
      host.prepend(hmScene());
      shell.insertBefore(hmLockup(),heading);
      heading.querySelector(".fifaMenuEyebrow")?.classList.add("sd-label");
      heading.querySelector("h2")?.classList.add("sd-label");
      heading.querySelector(".fifaMenuHeadingMeta")?.classList.add("sd-body");
      heading.querySelector(".fifaMenuHeadingMeta > span")?.classList.add("sd-label");
      host.appendChild(hmDecor("nav-reserve"));
      host.appendChild(hmDecor("footDeco",'<span>FOOTBALL BRINGS US TOGETHER</span><svg viewBox="0 0 24 18" focusable="false"><path d="M2 16h20l1.5-12-6 5L12 1 6.5 9l-6-5z" fill="#F2C45B"/></svg>'));
    }
    Object.entries(TILE_ART).forEach(([id,file])=>hmTile(id,file));
    hmTrophyTile(grid);
    // HO-004: every tile is Team V's shared cut-corner panel (Continue is the hero panel), as in Team V's Home frame.
    grid.querySelectorAll(".menuTile").forEach(tile=>tile.classList.add(...PANEL_CLASSES(tile)));
    hmStartMusic();
    host.classList.add("stage","v10Home");
    hmQuotaNotice();
    return true;
  }
  function hmUnmount(host){if(!host)return;host.classList.remove("stage","v10Home");host.querySelectorAll(".fifaMenuGrid .menuTile").forEach(tile=>tile.classList.remove("sd-panel","sd-panel--hero"));}

  function install(){
    if(registered)return registered;
    const V=root.CareerModeV10Screens;
    if(!V)return Promise.reject(new Error("V10_SCREEN_LOADER_UNAVAILABLE"));
    V.register("mainMenu",{css:HOME_CSS.slice(),js:[],frame:()=>FRAME,mount:hmDecorate,unmount:hmUnmount});
    hmStartMusic();
    if(typeof root.addEventListener==="function")root.addEventListener("career-mode-firestore-quota",hmQuotaNotice);
    hmDoc()?.addEventListener("career-mode-screen-shown",hmQuotaNotice);
    root.matchMedia?.(HM_PHONE_QUOTA)?.addEventListener?.("change",hmQuotaNotice);
    const app=hmDoc()?.getElementById("app");
    if(app&&root.MutationObserver)new root.MutationObserver(hmQuotaNotice).observe(app,{subtree:true,attributes:true,attributeFilter:["inert"]});
    registered=V.show("mainMenu").catch(error=>{root.console?.warn?.("[Career Mode Showdown] Team V Home unavailable.",error);return false;});
    return registered;
  }
  return Object.freeze({MEDIA,TILE_ART,TROPHY_TILE,HOME_CSS,install,decorateHome:hmDecorate,unmountHome:hmUnmount});
});
