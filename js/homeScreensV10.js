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
  const STORY_FRAME=Object.freeze({skin:"story-r88"});
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
  // r88 STORY (Nik's pick 2026-11-02: after Trophy Room): an eighth Home tile that opens a short local page about how the
  // Showdown was built, with one link to the full history site published with the game (chronicle/). The page is drawn here,
  // works offline, reads and sends no game data, and never touches a career, a season or Firebase.
  const STORY_TILE=Object.freeze({id:"homeStoryButton",after:"homeTrophyRoomButton",code:"CHRONICLE",label:"STORY",
    meta:"How the Showdown was built."});
  // The one place the full story's address lives. Same origin and same tab, so the signed-in session and the single game tab
  // are kept; the site's own "Back to the game" link comes straight back here.
  const STORY_URL="chronicle/";
  const STORY_SCREEN="story";
  const STORY_OFFLINE_LINE="Connect to the internet to read the full story.";
  // Placeholder film-reel icon until Team V's TILE_STORY_V1.webp lands (relay ticket, r88). Decorative, no lettering.
  const STORY_ART='<svg class="tileArt storyTileArt" aria-hidden="true" focusable="false" viewBox="0 0 120 120" preserveAspectRatio="xMaxYMax meet"><defs><linearGradient id="storyReelGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE38A"/><stop offset=".55" stop-color="#E2B04A"/><stop offset="1" stop-color="#9A6A1C"/></linearGradient></defs><path d="M58 92c14 8 34 8 52-2v12c-18 10-38 10-52 2z" fill="#1b1d22" stroke="url(#storyReelGold)" stroke-width="2"/><g fill="url(#storyReelGold)"><rect x="66" y="96" width="5" height="4" rx="1"/><rect x="78" y="98" width="5" height="4" rx="1"/><rect x="90" y="97" width="5" height="4" rx="1"/><rect x="101" y="94" width="5" height="4" rx="1"/></g><circle cx="50" cy="56" r="40" fill="#15171b" stroke="url(#storyReelGold)" stroke-width="5"/><circle cx="50" cy="56" r="9" fill="url(#storyReelGold)"/><circle cx="50" cy="56" r="3.5" fill="#15171b"/><g fill="#0b0c0f" stroke="url(#storyReelGold)" stroke-width="2"><circle cx="50" cy="31" r="10"/><circle cx="71.7" cy="68.5" r="10"/><circle cx="28.3" cy="68.5" r="10"/><circle cx="71.7" cy="43.5" r="6"/><circle cx="28.3" cy="43.5" r="6"/><circle cx="50" cy="81" r="6"/></g></svg>';
  const STORY_SECTIONS=Object.freeze([
    Object.freeze(["THE BEGINNING","It started as a free way to keep score in a FIFA 17 Career Mode rivalry between two mates, Daniel and Nik: one league, two clubs kept for the whole Showdown, trophies for points and a timed Transfer War."]),
    Object.freeze(["HOW IT GREW","The score sheet became a two-phone online game: private pairing, shared seasons on both phones, the league and club wheels, Roster Roulette, the Prime Pack and the marble look, each step tested on Daniel's and Nik's real phones before it shipped."]),
    Object.freeze(["THE COLLABORATORS","Nik set the direction and played every test with Daniel. Claude worked in two teams, Team G for gameplay and Team V for the look, with GPT models coordinating, reviewing and writing the full history."])
  ]);
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

  function hmStoryTile(grid){
    const t=STORY_TILE;
    if(hmDoc().getElementById(t.id))return;
    const anchor=hmDoc().getElementById(t.after);
    // menuTileRules: Team V's class-based secondary-tile type (home.css) applies to STORY as to Rule Book.
    const button=hmEl("button","menuTile menuTileRules menuTileStory",'<span class="menuTileCode">'+t.code+'</span><span class="menuTileLabel">'+t.label+'</span><span class="menuTileMeta">'+t.meta+'</span>'+STORY_ART+CHEVRON);
    button.id=t.id;button.type="button";button.dataset.routeKey=STORY_SCREEN;
    button.setAttribute("aria-label","Story: how the Showdown was built");
    button.addEventListener("click",()=>openStory());
    if(anchor&&anchor.parentNode===grid)anchor.insertAdjacentElement("afterend",button);else grid.appendChild(button);
  }

  // ---- STORY page (local, offline-safe) ----
  function hmStoryOnline(){return root.navigator?.onLine!==false;}
  function hmStorySync(){
    const doc=hmDoc(),page=doc?.getElementById(STORY_SCREEN);
    if(!page)return;
    const online=hmStoryOnline(),link=page.querySelector(".storyRead"),note=page.querySelector(".storyOffline");
    if(link){
      if(online){link.setAttribute("href",STORY_URL);link.removeAttribute("aria-disabled");link.removeAttribute("tabindex");}
      else{link.removeAttribute("href");link.setAttribute("aria-disabled","true");}
    }
    if(note)note.hidden=online;
  }
  function hmStoryPage(){
    const doc=hmDoc();
    let page=doc?.getElementById(STORY_SCREEN);
    if(page)return page;
    const main=doc?.querySelector("main");
    if(!main)return null;
    page=doc.createElement("section");
    page.id=STORY_SCREEN;page.className="screen hidden storyScreen";page.setAttribute("aria-hidden","true");
    page.setAttribute("aria-labelledby","storyTitle");
    const sections=STORY_SECTIONS.map(([title,text],i)=>'<article class="storySection sd-panel"><span class="storySectionNo" aria-hidden="true">0'+(i+1)+'</span><h3>'+title+'</h3><p>'+text+'</p></article>').join("");
    page.innerHTML='<div class="storyInner">'+
      '<p class="storyKicker sd-label">CAREER MODE SHOWDOWN</p>'+
      '<h2 id="storyTitle" class="storyTitle">STORY</h2>'+
      '<p class="storyLead">Two friends. One rivalry. A project that kept growing. Follow the people, ideas and teams that shaped Career Mode Showdown, from its first experiments to real-phone milestones and cinematic Roulette.</p>'+
      '<div class="storySections">'+sections+'</div>'+
      '<p class="storyOffline" role="status" hidden>'+STORY_OFFLINE_LINE+'</p>'+
      '<div class="storyActions">'+
        '<a class="storyRead storyButton storyButtonPrimary" href="'+STORY_URL+'">READ THE FULL STORY</a>'+
        '<button class="storyBack storyButton" type="button">BACK TO HOME</button>'+
      '</div>'+
      '<p class="storyPrivacy">The full story is a separate page on this site. Nothing from your Showdown is sent to it.</p>'+
    '</div>';
    page.querySelector(".storyBack").addEventListener("click",()=>{
      if(typeof root.navigateTo==="function")root.navigateTo("mainMenu");else root.showScreen?.("mainMenu");
    });
    page.querySelector(".storyRead").addEventListener("click",event=>{if(!hmStoryOnline()){event.preventDefault();hmStorySync();}});
    main.appendChild(page);
    root.addEventListener?.("online",hmStorySync);
    root.addEventListener?.("offline",hmStorySync);
    return page;
  }
  // STORY joins Team V's loader on its first open (Home's own install is untouched), keeping Home's sheets on while it shows.
  let storyRegistered=false;
  function openStory(){
    if(!hmStoryPage())return false;
    const V=root.CareerModeV10Screens;
    if(!storyRegistered&&V?.register){try{V.register(STORY_SCREEN,{css:HOME_CSS.slice(),js:[],frame:()=>STORY_FRAME,mount:hmStoryMount});}catch(_error){}storyRegistered=true;}
    hmStorySync();
    return root.showScreen?.(STORY_SCREEN)===true;
  }
  function hmStoryMount(){hmStorySync();return true;}

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
    hmStoryTile(grid);
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
  return Object.freeze({MEDIA,TILE_ART,TROPHY_TILE,STORY_TILE,STORY_URL,HOME_CSS,install,openStory,decorateHome:hmDecorate,unmountHome:hmUnmount});
});
