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
  // home/fixtures.json strings.media at 5e05a1f (Nik's four Audius tracks; YouTube songs and trailer dropped).
  const MEDIA=Object.freeze({
    sectionLabel:"Menu media",selectorLabel:"Choose Audius soundtrack",category:"AUDIUS SOUNDTRACK",source:"AUDIUS",
    toggle:"PLAY TRACK",pause:"PAUSE TRACK",mute:"MUTE",unmute:"UNMUTE",
    statusTemplate:"{TITLE} · AUDIUS · READY",statusLoading:"CONNECTING TO AUDIUS",statusPlaying:"PLAYING",
    statusPlayingMuted:"PLAYING · MUTED",statusPaused:"PAUSED",statusError:"STREAM UNAVAILABLE · TRY AGAIN OR PICK ANOTHER TRACK",
    tracks:Object.freeze([
      Object.freeze({key:"whatYouGot",title:"WHAT YOU GOT",artist:"Valentino Khan & NITTI",audiusTrackId:"XNN7jYJ"}),
      Object.freeze({key:"snowGlobe",title:"SNOW GLOBE",artist:"Hadji Gaviota",audiusTrackId:"X9wlA0b"}),
      Object.freeze({key:"nasty",title:"NASTY",artist:"grouptherapy.",audiusTrackId:"G5rXAWE"}),
      Object.freeze({key:"imAlwaysRight",title:"I'M ALWAYS RIGHT",artist:"The Holdup",audiusTrackId:"9QRXKw"})
    ]),
    defaultTrack:"whatYouGot",
    audius:Object.freeze({apiBase:"https://api.audius.co/v1",appName:"CareerModeShowdown17"})
  });
  // Continue shows Team V's number-17 player (owner, 2026-10-05); css/homeV10.css hides the old Reus cover on this Home.
  // Legacy and Statistics stay hidden by the product's r43 containment; their art shows only if the product shows them.
  const TILE_ART=Object.freeze({
    continueCareer:"TILE_CONTINUE_V1.webp",newShowdown:"TILE_TACTICS_V1.webp",legacyButton:"TILE_HISTORY_V1.webp",careerStatisticsButton:"TILE_STATISTICS_V1.webp",
    ruleBookButton:"TILE_RULEBOOK_V1.webp",settingsButton:"TILE_SETTINGS_V1.webp"
  });
  const CHEVRON='<svg class="tileChevron" aria-hidden="true" focusable="false" viewBox="0 0 12 20"><path d="M2 2l8 8-8 8" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const HOME_CSS=Object.freeze(["home/home.css","../../css/homeV10.css"]);
  let registered=null;

  const hmDoc=()=>root.document;
  function hmEl(tag,className,html){const el=hmDoc().createElement(tag);if(className)el.className=className;if(html)el.innerHTML=html;return el;}
  function hmDecor(className,html){const el=hmEl("div",className,html);el.setAttribute("aria-hidden","true");return el;}

  // Team V's stage layers (index.html at 5e05a1f), all decorative.
  function hmScene(){
    const pic=(cls,file,extra)=>`<picture class="${cls}"${extra||""}><source media="(max-width: 760px) and (orientation: portrait)" srcset="${BASE}home/assets/${file}" type="image/webp"><img alt="" decoding="async"></picture>`;
    const frag=hmDoc().createDocumentFragment();
    frag.append(
      hmDecor("plateView",pic("phoneHeroBackground","ENV_HOME_PHONE_V1.webp")+'<div class="plateLayer"></div>'),
      hmDecor("v10HomeCutouts",pic("phoneHeroCutout phoneHeroDaniel","OVL_HOME_DANIEL_PHONE_V2.webp")+pic("phoneHeroCutout phoneHeroNik","OVL_HOME_NIK_PHONE_V2.webp")),
      hmDecor("phoneHeroGrade"),hmDecor("scrim scrimTop"),hmDecor("scrim scrimLow"),hmDecor("dockBed"),
      hmDecor("scriptLine","<span>More Than A Game</span>")
    );
    return frag;
  }
  function hmLockup(){
    return hmEl("div","homeLockup",'<p class="lockupKicker sd-label" aria-hidden="true">THE RIVALRY STARTS HERE</p><div class="lockupWordmarkWrap sd-title sd-title--wordmark"><span class="sd-visually-hidden">CAREER MODE SHOWDOWN 17</span><img class="lockupWordmark" src="'+BASE+'home/assets/LOGO_CM17_WORDMARK_V1.webp" alt="" aria-hidden="true" width="1040" height="378" decoding="async"></div><p class="lockupLegacy sd-tagline" aria-hidden="true">TWO MANAGERS · ONE LEGACY</p>');
  }
  function hmTile(id,file){
    const button=hmDoc().getElementById(id);
    if(!button)return;
    if(!button.querySelector(".tileArt")){
      const img=hmEl("img","tileArt");img.src=BASE+"shared/art/home-tiles/"+file;img.alt="";img.setAttribute("aria-hidden","true");img.decoding="async";
      button.appendChild(img);
    }
    if(!button.querySelector(".tileChevron"))button.insertAdjacentHTML("beforeend",CHEVRON);
  }

  // The Audius card replaces the YouTube player in place. The product's YouTube nodes (#menuMusicPlayer and the seven
  // YouTube choices in #menuMediaSelector) move into a hidden holder, because
  // js/diagnostics.js and js/menuExperience.js still check them. The toggle, mute and status keep their ids;
  // the two buttons are cloned so the YouTube click listeners are left behind.
  function hmMusic(host){
    const doc=hmDoc(),card=host.querySelector(".menuMusicTile"),toggle=doc.getElementById("menuMusicToggle"),mute=doc.getElementById("menuMusicMute"),status=doc.getElementById("menuMusicStatus");
    if(!card||card.dataset.v10Media==="audius"||!toggle||!mute||!status||!root.HomeSoundtrack)return;
    try{if(typeof root.isMenuMediaPlaying==="function"&&root.isMenuMediaPlaying()&&typeof root.toggleMenuMusic==="function")root.toggleMenuMusic();}catch(error){}
    const retired=hmEl("div","v10HomeRetiredMedia");retired.hidden=true;retired.setAttribute("aria-hidden","true");
    for(const id of ["menuMusicPlayer","menuMediaSelector"]){const el=doc.getElementById(id);if(el){el.querySelectorAll("iframe").forEach(frame=>frame.remove());retired.appendChild(el);}}
    host.appendChild(retired);
    const offlineText=toggle.disabled&&/OFFLINE/i.test(status.textContent||"")?status.textContent:null;
    const nextToggle=toggle.cloneNode(true),nextMute=mute.cloneNode(true);
    nextToggle.dataset.musicBound="true";nextMute.dataset.musicBound="true";
    const first=MEDIA.tracks.find(track=>track.key===MEDIA.defaultTrack)||MEDIA.tracks[0];
    const header=hmEl("div","menuMusicHeader",'<div><span></span><strong></strong><p class="menuMusicArtist"></p></div><small class="menuMusicSource"></small>');
    header.querySelector("span").textContent=MEDIA.category;header.querySelector("strong").textContent=first.title;
    header.querySelector(".menuMusicArtist").textContent=first.artist;header.querySelector(".menuMusicSource").textContent=MEDIA.source;
    const sheet=hmEl("input","phoneSheetToggle");sheet.id="phoneTrackSheetToggle";sheet.type="checkbox";sheet.setAttribute("aria-label","Open soundtrack choices");
    const label=(cls,text,hidden)=>{const el=hmEl("label",cls);el.htmlFor="phoneTrackSheetToggle";el.textContent=text;if(hidden)el.setAttribute("aria-hidden","true");return el;};
    const selector=hmEl("div","menuMediaSelector sd-sheet");selector.id="menuAudiusSelector";selector.setAttribute("role","group");selector.setAttribute("aria-label",MEDIA.selectorLabel);
    for(const track of MEDIA.tracks){
      const choice=hmEl("button","menuMediaChoice","<strong></strong><small></small>");choice.type="button";choice.dataset.soundtrackTrack=track.key;
      choice.querySelector("strong").textContent=track.title;choice.querySelector("small").textContent=track.artist;selector.appendChild(choice);
    }
    const deck=hmEl("div","menuMusicPlayer",'<div class="vinylDeck" aria-hidden="true"><span class="vinyl"><i></i></span><span class="eq"><i></i><i></i><i></i><i></i><i></i></span></div>');
    const controls=hmEl("div","menuMusicControls");controls.append(nextToggle,nextMute);
    card.replaceChildren(header,sheet,label("phoneTrackSheetOpen","TRACKS",true),selector,label("phoneTrackSheetBackdrop","",true),label("phoneTrackSheetClose","CLOSE",false),deck,status,controls);
    card.dataset.mediaKind="music";card.dataset.v10Media="audius";
    root.HomeSoundtrack.init(MEDIA);
    if(offlineText){nextToggle.disabled=true;nextToggle.setAttribute("aria-disabled","true");status.textContent=offlineText;}
  }
  // js/offlineApp.js disables the toggle and writes its offline line; when it comes back online it restores the
  // line it saved (the YouTube one), so the Audius player redraws its own status.
  function hmOnline(event){
    const card=hmDoc()&&hmDoc().querySelector(".menuMusicTile[data-v10-media='audius']");
    if(card&&root.HomeSoundtrack&&event&&event.detail&&event.detail.connectivityLabel!=="Offline")root.HomeSoundtrack.init(MEDIA);
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
    hmMusic(host);
    host.classList.add("stage","v10Home");
    return true;
  }
  function hmUnmount(host){if(host)host.classList.remove("stage","v10Home");}

  function install(){
    if(registered)return registered;
    const V=root.CareerModeV10Screens;
    if(!V)return Promise.reject(new Error("V10_SCREEN_LOADER_UNAVAILABLE"));
    V.register("mainMenu",{css:HOME_CSS.slice(),js:[["v10-home-soundtrack","home/soundtrack.js",()=>Boolean(root.HomeSoundtrack)]],frame:()=>FRAME,mount:hmDecorate,unmount:hmUnmount});
    if(typeof root.addEventListener==="function")root.addEventListener("career-mode-offline-state-change",hmOnline);
    registered=V.show("mainMenu").catch(error=>{root.console?.warn?.("[Career Mode Showdown] Team V Home unavailable.",error);return false;});
    return registered;
  }
  return Object.freeze({MEDIA,TILE_ART,HOME_CSS,install,decorateHome:hmDecorate,unmountHome:hmUnmount});
});
