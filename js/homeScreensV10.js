(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeHomeScreensV10=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // JOB-25: production binding for Team V's Home and Loading skins. The existing Home
  // controls are decorated in place so their product-owned listeners and identity copy survive.
  const BASE="visual-assets/v10_1/";
  const FRAME=Object.freeze({skin:"team-v-5e05a1f"});
  const MEDIA=Object.freeze({
    category:"AUDIUS SOUNDTRACK",toggle:"PLAY TRACK",pause:"PAUSE TRACK",mute:"MUTE",unmute:"UNMUTE",
    statusTemplate:"{TITLE} · AUDIUS · READY",statusLoading:"CONNECTING TO AUDIUS",statusPlaying:"PLAYING",
    statusPlayingMuted:"PLAYING · MUTED",statusPaused:"PAUSED",statusError:"STREAM UNAVAILABLE · TRY AGAIN OR PICK ANOTHER TRACK",
    defaultTrack:"whatYouGot",audius:Object.freeze({apiBase:"https://api.audius.co/v1",appName:"CareerModeShowdown17"}),
    tracks:Object.freeze([
      Object.freeze({key:"whatYouGot",title:"WHAT YOU GOT",artist:"Valentino Khan & NITTI",audiusTrackId:"XNN7jYJ"}),
      Object.freeze({key:"snowGlobe",title:"SNOW GLOBE",artist:"Hadji Gaviota",audiusTrackId:"X9wlA0b"}),
      Object.freeze({key:"nasty",title:"NASTY",artist:"grouptherapy.",audiusTrackId:"G5rXAWE"}),
      Object.freeze({key:"imAlwaysRight",title:"I'M ALWAYS RIGHT",artist:"The Holdup",audiusTrackId:"9QRXKw"})
    ])
  });
  const TILE_ART=Object.freeze({
    continueCareer:"TILE_CONTINUE_V1.webp",newShowdown:"TILE_TACTICS_V1.webp",legacyButton:"TILE_HISTORY_V1.webp",
    careerStatisticsButton:"TILE_STATISTICS_V1.webp",ruleBookButton:"TILE_RULEBOOK_V1.webp",settingsButton:"TILE_SETTINGS_V1.webp"
  });
  let registered=null;

  function art(button,file){
    if(!button||button.querySelector(".tileArt"))return;
    const img=root.document.createElement("img");img.className="tileArt";img.src=BASE+"shared/art/home-tiles/"+file;
    img.alt="";img.setAttribute("aria-hidden","true");img.decoding="async";button.appendChild(img);
  }
  function decorateHome(frame,host){
    if(host.dataset.homeV10==="1")return true;
    host.dataset.homeV10="1";host.classList.add("stage");host.id="mainMenu";
    const shell=host.querySelector(".fifaMenuShell"),heading=host.querySelector(".fifaMenuHeading"),grid=host.querySelector(".fifaMenuGrid");
    if(!shell||!heading||!grid)return false;
    const scene=root.document.createElement("div");scene.className="plateView";scene.setAttribute("aria-hidden","true");
    scene.innerHTML='<picture class="phoneHeroBackground"><source media="(max-width: 760px) and (orientation: portrait)" srcset="'+BASE+'home/assets/ENV_HOME_PHONE_V1.webp" type="image/webp"><img alt="" aria-hidden="true"></picture><div class="plateLayer"></div>';
    host.prepend(scene);
    const lockup=root.document.createElement("div");lockup.className="homeLockup";
    lockup.innerHTML='<p class="lockupKicker sd-label">THE RIVALRY STARTS HERE</p><div class="lockupWordmarkWrap sd-title sd-title--wordmark"><span class="sd-visually-hidden">CAREER MODE SHOWDOWN 17</span><img class="lockupWordmark" src="'+BASE+'home/assets/LOGO_CM17_WORDMARK_V1.webp" alt="" aria-hidden="true" width="1040" height="378"></div><p class="lockupLegacy sd-tagline">TWO MANAGERS · ONE LEGACY</p>';
    shell.insertBefore(lockup,heading);
    Object.entries(TILE_ART).forEach(([id,file])=>art(root.document.getElementById(id),file));
    let trophy=root.document.getElementById("trophyRoomButton");
    if(!trophy){trophy=root.document.createElement("button");trophy.id="trophyRoomButton";trophy.type="button";trophy.className="menuTile menuTileTrophyRoom sd-panel";trophy.innerHTML='<span class="menuTileCode">HONOURS</span><span class="menuTileLabel">TROPHY ROOM</span><span class="menuTileMeta">Career trophies, standings and records</span><img class="tileArt" src="'+BASE+'shared/trophies/TRO_LEAGUE_TITLE_V1_512.webp" alt="" aria-hidden="true">';trophy.addEventListener("click",()=>root.openOptionalModule?.("trophyRoom"));grid.appendChild(trophy);}
    const card=host.querySelector(".menuMusicTile");
    if(card){card.dataset.mediaKind="music";card.innerHTML='<div class="menuMusicHeader"><div><span>AUDIUS SOUNDTRACK</span><strong>WHAT YOU GOT</strong><p class="menuMusicArtist">Valentino Khan &amp; NITTI</p></div><small class="menuMusicSource">AUDIUS</small></div><div id="menuMediaSelector" class="menuMediaSelector" role="group" aria-label="Choose Audius soundtrack"></div><div class="menuMusicPlayer"><div class="vinylDeck" aria-hidden="true"><span class="vinyl"><i></i></span><span class="eq"><i></i><i></i><i></i><i></i><i></i></span></div></div><p id="menuMusicStatus" class="menuMusicStatus" role="status" aria-live="polite">WHAT YOU GOT · AUDIUS · READY</p><div class="menuMusicControls"><button id="menuMusicToggle" class="menuMusicControl" type="button">PLAY TRACK</button><button id="menuMusicMute" class="menuMusicControl" type="button" disabled>MUTE</button></div>';
      const selector=card.querySelector("#menuMediaSelector");MEDIA.tracks.forEach(track=>{const b=root.document.createElement("button");b.type="button";b.className="menuMediaChoice";b.dataset.menuMediaSource=track.key;b.innerHTML='<strong></strong><small></small>';b.querySelector("strong").textContent=track.title;b.querySelector("small").textContent=track.artist;selector.appendChild(b);});
      root.HomeSoundtrack.init(MEDIA);
    }
    root.sdEnter?.(host);return true;
  }
  function decorateLoading(frame,host){
    if(host.dataset.loadingV10==="1")return true;host.dataset.loadingV10="1";host.classList.add("sd-stage","loadingStage");
    const credit=host.querySelector(".startupPhotoCredit");if(credit){credit.removeAttribute("aria-hidden");credit.innerHTML='Marco Reus photo: <a href="https://www.flickr.com/photos/foto_db/16204330530/">Tim Reckmann</a> · <a href="https://creativecommons.org/licenses/by/2.0/">CC BY 2.0</a> · Cropped for display';}
    const identity=host.querySelector(".startupIdentity");if(identity&&!identity.querySelector(".loadingWordmark")){identity.removeAttribute("aria-hidden");identity.querySelector(".startupRoundel")?.remove();identity.querySelector("h1")?.remove();const mark=root.document.createElement("div");mark.className="loadingWordmark sd-title sd-title--wordmark";mark.innerHTML='<span class="sd-visually-hidden">CAREER MODE SHOWDOWN 17</span><img src="'+BASE+'loading/assets/LOGO_CM17_WORDMARK_LOADING_V1.webp" alt="" aria-hidden="true" width="720" height="262">';identity.insertBefore(mark,identity.querySelector(".startupEdition"));}
    const pulse=host.querySelector(".startupPulse");if(pulse)pulse.outerHTML='<div class="startupProgress" aria-hidden="true"><span class="startupProgressFill"></span><span class="startupProgressGlint"></span></div>';
    root.document.documentElement.dataset.nav="none";return true;
  }
  function install(){
    if(registered)return registered;
    const V=root.CareerModeV10Screens;if(!V)return Promise.reject(new Error("V10_SCREEN_LOADER_UNAVAILABLE"));
    V.register("mainMenu",{css:["home/home.css"],js:[["v10-home-soundtrack","home/soundtrack.js",()=>Boolean(root.HomeSoundtrack)]],frame:()=>FRAME,mount:decorateHome});
    V.register("loadingScreen",{css:["loading/loading.css"],frame:()=>FRAME,mount:decorateLoading});
    registered=Promise.resolve(true);if(root.getActiveScreenName?.()==="mainMenu")V.show("mainMenu");return registered;
  }
  return Object.freeze({MEDIA,TILE_ART,install,decorateHome,decorateLoading});
});
