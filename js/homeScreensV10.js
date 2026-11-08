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
  // r90 W9 (LOOK hunt L12, Nik 2026-11-08 "no AI look"): the tiles carry one hand-drawn line-icon set (same 48-unit grid, same
  // stroke, flat gold on marble, drawn here as inline SVG) instead of seven 3D renders lit seven ways; CONTINUE shows a drawn
  // number-17 shirt instead of the player photo. No picture is fetched for a tile any more.
  // r90 W8 (right-sized pictures): the Home pictures still in use come as half-size copies (*_<width>W.webp, same art).
  const WORDMARK_SIZES="(max-width: 900px) 330px, 31vw";
  const ICON_PATHS=Object.freeze({
    // a number-17 shirt (CONTINUE CAREER)
    continue:'<path d="M18 8.5 9 13l2.8 8.4 4.7-1.9V40h15V19.5l4.7 1.9L39 13l-9-4.5c-.9 2.6-3.3 4.2-6 4.2s-5.1-1.6-6-4.2Z"/><path d="M19.6 25.2l2.6-1.7v11"/><path d="M25.8 23.5h5.6l-3.8 11"/>',
    // a tactics board (the new-Showdown tile)
    newShowdown:'<rect x="7" y="9" width="34" height="30" rx="2"/><path d="M24 9v30"/><circle cx="24" cy="24" r="4.5"/><path d="m11.5 15.5 4 4m0-4-4 4"/><circle cx="35" cy="31" r="2.4"/><path d="M14 31c3.5-5 9-6.6 15.2-4.6" stroke-dasharray="2.2 2.6"/><path d="m27.6 23.8 3.2 2.9-4.1 1.4"/>',
    // a laurel wreath round a star (LEGACY)
    legacyButton:'<path d="M17.5 39C10.4 35.2 7 27.6 8.6 18.6"/><path d="M30.5 39c7.1-3.8 10.5-11.4 8.9-20.4"/><path d="M9 31.5c-2.8-.4-4.6-2.4-4.8-5.2 2.8.3 4.6 2.3 4.8 5.2Z"/><path d="M8.3 24c-2.6-1-3.9-3.4-3.4-6.1 2.6 1 3.9 3.4 3.4 6.1Z"/><path d="M13.3 36.6c-2.4 1-5 .3-6.5-1.9 2.4-1 5-.3 6.5 1.9Z"/><path d="M39 31.5c2.8-.4 4.6-2.4 4.8-5.2-2.8.3-4.6 2.3-4.8 5.2Z"/><path d="M39.7 24c2.6-1 3.9-3.4 3.4-6.1-2.6 1-3.9 3.4-3.4 6.1Z"/><path d="M34.7 36.6c2.4 1 5 .3 6.5-1.9-2.4-1-5-.3-6.5 1.9Z"/><path d="m24 14.5 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8Z"/>',
    // bars on a base line with a rising line (STATISTICS)
    careerStatisticsButton:'<path d="M7 40h34"/><rect x="10" y="29" width="5" height="11"/><rect x="18.5" y="23" width="5" height="17"/><rect x="27" y="26" width="5" height="14"/><rect x="35.5" y="17" width="5" height="23" transform="translate(-1 0)"/><path d="m10.5 20.5 8.5-7 8 4 9.5-8.5"/><path d="m32.4 9 4.1 0 .1 4"/>',
    // a cup on a plinth (TROPHY ROOM)
    homeTrophyRoomButton:'<path d="M16 8h16v9.5a8 8 0 0 1-16 0Z"/><path d="M16 11h-4.2a4.6 4.6 0 0 0 4.6 7.6M32 11h4.2a4.6 4.6 0 0 1-4.6 7.6"/><path d="M24 25.5V31"/><path d="M19.5 31h9l1.2 5h-11.4Z"/><path d="M16 40h16"/>',
    // a quill over a written page (STORY)
    homeStoryButton:'<path d="M9 40h21"/><path d="M9 34h12M9 28h9"/><path d="M39.5 7.5C30 9.5 22.6 17 20.5 30"/><path d="M39.5 7.5c-1.2 10.6-7.8 18.6-19 22.5"/><path d="M27.5 18.5l4 4"/>',
    // an open book (RULE BOOK)
    ruleBookButton:'<path d="M24 13c-4.2-3-10-4-16-3v27c6-1 11.8 0 16 3 4.2-3 10-4 16-3V10c-6-1-11.8 0-16 3Z"/><path d="M24 13v27"/><path d="M12 17h7.5M12 22h7.5M12 27h5M28.5 17H36M28.5 22H36M28.5 27h5"/>',
    // a gear (SETTINGS, also the corner Settings button in the top bar)
    settingsButton:'<path d="M35.2 21.6 38.9 21.9 38.9 26.1 35.2 26.4 33.7 30.2 36 33 33 36 30.2 33.7 26.4 35.2 26.1 38.9 21.9 38.9 21.6 35.2 17.8 33.7 15 36 12 33 14.3 30.2 12.8 26.4 9.1 26.1 9.1 21.9 12.8 21.6 14.3 17.8 12 15 15 12 17.8 14.3 21.6 12.8 21.9 9.1 26.1 9.1 26.4 12.8 30.2 14.3 33 12 36 15 33.7 17.8Z"/><circle cx="24" cy="24" r="5"/>'
  });
  const TILE_ICONS=Object.freeze({continueCareer:"continue",newShowdown:"newShowdown",legacyButton:"legacyButton",careerStatisticsButton:"careerStatisticsButton",
    homeTrophyRoomButton:"homeTrophyRoomButton",homeStoryButton:"homeStoryButton",ruleBookButton:"ruleBookButton",settingsButton:"settingsButton"});
  const tileIcon=key=>'<svg class="tileArt tileIcon" data-icon="'+key+'" viewBox="0 0 48 48" preserveAspectRatio="xMaxYMax meet" aria-hidden="true" focusable="false">'+ICON_PATHS[key]+'</svg>';
  // The seventh tile, Trophy Room, as in Team V's Home frame (home/index.html at 5e05a1f). The product has no Home
  // button for it, so this Home adds one that opens the product's own Trophy Room route. Its id is not Team V's
  // #trophyRoomButton, because Career Statistics already owns that id.
  const TROPHY_TILE=Object.freeze({id:"homeTrophyRoomButton",after:"careerStatisticsButton",code:"HONOURS",label:"TROPHY ROOM",
    meta:"Career trophies, standings and records"});
  // r88 STORY (Nik's pick 2026-11-02: after Trophy Room): an eighth Home tile that opens a short local page about how the
  // Showdown was built, with one link to the full history site published with the game (chronicle/). The page is drawn here,
  // works offline, reads and sends no game data, and never touches a career, a season or Firebase.
  const STORY_TILE=Object.freeze({id:"homeStoryButton",after:"homeTrophyRoomButton",code:"ORIGINS",label:"STORY",
    meta:"How the Showdown was built."});
  // The one place the full story's address lives. Same origin and same tab, so the signed-in session and the single game tab
  // are kept; the site's own "Back to the game" link comes straight back here.
  const STORY_URL="chronicle/";
  const STORY_SCREEN="story";
  const STORY_OFFLINE_LINE="Connect to the internet to read the full story.";
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
    return hmEl("div","homeLockup",'<p class="lockupKicker sd-label" aria-hidden="true">THE SHOWDOWN STARTS HERE</p><div class="lockupWordmarkWrap sd-title sd-title--wordmark"><span class="sd-visually-hidden">CAREER MODE SHOWDOWN 17</span><img class="lockupWordmark" src="'+BASE+'home/assets/LOGO_CM17_WORDMARK_V1.webp" srcset="'+BASE+'home/assets/LOGO_CM17_WORDMARK_V1_640W.webp 640w, '+BASE+'home/assets/LOGO_CM17_WORDMARK_V1.webp 1040w" sizes="'+WORDMARK_SIZES+'" alt="" aria-hidden="true" width="1040" height="378" decoding="async"></div><p class="lockupLegacy sd-tagline" aria-hidden="true">TWO MANAGERS · ONE LEGACY</p>');
  }
  function hmTile(id){
    const button=hmDoc().getElementById(id);
    if(!button)return;
    if(!button.querySelector(".tileArt"))button.insertAdjacentHTML("beforeend",tileIcon(TILE_ICONS[id]));
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
    hmTile(t.id);
  }

  function hmStoryTile(grid){
    const t=STORY_TILE;
    if(hmDoc().getElementById(t.id))return;
    const anchor=hmDoc().getElementById(t.after);
    // menuTileRules: Team V's class-based secondary-tile type (home.css) applies to STORY as to Rule Book.
    const button=hmEl("button","menuTile menuTileRules menuTileStory",'<span class="menuTileCode">'+t.code+'</span><span class="menuTileLabel">'+t.label+'</span><span class="menuTileMeta">'+t.meta+'</span>'+tileIcon(TILE_ICONS[t.id])+CHEVRON);
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
    ["continueCareer","newShowdown","legacyButton","careerStatisticsButton","ruleBookButton","settingsButton"].forEach(hmTile);
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
  return Object.freeze({MEDIA,TILE_ICONS,ICON_PATHS,TROPHY_TILE,STORY_TILE,STORY_URL,HOME_CSS,install,openStory,decorateHome:hmDecorate,unmountHome:hmUnmount});
});
