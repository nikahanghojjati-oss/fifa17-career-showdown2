(function(root){
  "use strict";

  const API_BASE="https://api.audius.co/v1";
  const APP_NAME="CareerModeShowdown17";
  const STYLE_MARKER="audius-player";
  let mounted=null;

  function audiusEndpoint(path){
    const join=path.includes("?")?"&":"?";
    return API_BASE+path+join+"app_name="+encodeURIComponent(APP_NAME);
  }
  function audiusRevision(){
    return root.document?.querySelector('meta[name="app-asset-revision"]')?.content||"";
  }
  function audiusEnsureStyle(){
    if(!root.document)return null;
    let link=root.document.querySelector('link[data-audius-player-style="true"]');
    if(link)return link;
    link=root.document.createElement("link");
    link.rel="stylesheet";
    link.dataset.audiusPlayerStyle="true";
    const rev=audiusRevision();
    link.href="css/audius-player.css"+(rev?"?v="+encodeURIComponent(rev):"");
    root.document.head.appendChild(link);
    return link;
  }
  function audiusFormatTime(value){
    const seconds=Math.max(0,Math.floor(Number(value)||0));
    return Math.floor(seconds/60)+":"+String(seconds%60).padStart(2,"0");
  }
  function audiusIsMounted(){return Boolean(mounted&&mounted.root?.isConnected);}
  function audiusIsPlaying(){return Boolean(audiusIsMounted()&&!mounted.audio.paused&&!mounted.audio.ended);}
  function audiusSnapshot(){
    if(!audiusIsMounted())return {mounted:false,playing:false,muted:false,phase:"idle"};
    return {mounted:true,playing:audiusIsPlaying(),muted:Boolean(mounted.audio.muted),phase:mounted.phase};
  }
  function audiusSyncControls(){
    if(!root.document)return audiusSnapshot();
    const toggle=root.document.getElementById("menuMusicToggle");
    const mute=root.document.getElementById("menuMusicMute");
    const status=root.document.getElementById("menuMusicStatus");
    const state=audiusSnapshot();
    if(toggle)toggle.textContent=state.playing?"PAUSE TRACK":"PLAY TRACK";
    if(mute){
      mute.disabled=!state.mounted;
      mute.textContent=state.muted?"UNMUTE":"MUTE";
    }
    if(status){
      const labels={
        ready:"READY · PRESS PLAY",
        loading:"CONNECTING TO AUDIUS",
        paused:"PAUSED",
        ended:"ENDED · PRESS PLAY",
        error:"STREAM UNAVAILABLE"
      };
      status.textContent=state.playing?(state.muted?"PLAYING · MUTED":"PLAYING"):(labels[state.phase]||"READY · PRESS PLAY");
    }
    return state;
  }
  function audiusFail(message,error){
    if(!audiusIsMounted())return;
    mounted.phase="error";
    mounted.root.dataset.audiusState="error";
    mounted.status.textContent="STREAM UNAVAILABLE";
    audiusSyncControls();
    root.showAppNotice?.(message,"error",7000);
    console.warn("[Career Mode Showdown] Audius player:",error||message);
  }
  function audiusUpdateProgress(){
    if(!audiusIsMounted())return;
    const duration=Number(mounted.audio.duration);
    const current=Number(mounted.audio.currentTime)||0;
    const pct=Number.isFinite(duration)&&duration>0?Math.max(0,Math.min(100,current/duration*100)):0;
    mounted.progress.style.width=pct+"%";
    mounted.time.textContent=audiusFormatTime(current)+" / "+(Number.isFinite(duration)&&duration>0?audiusFormatTime(duration):"--:--");
  }
  async function audiusHydrateMetadata(){
    if(!audiusIsMounted()||mounted.metadataRequested)return;
    const requestTrack=String(mounted.track.trackId);
    mounted.metadataRequested=true;
    try{
      const response=await fetch(audiusEndpoint("/tracks/"+encodeURIComponent(requestTrack)),{
        method:"GET",credentials:"omit",mode:"cors",cache:"default"
      });
      if(!response.ok)throw new Error("AUDIUS_METADATA_"+response.status);
      const payload=await response.json(),track=payload?.data||payload;
      if(!audiusIsMounted()||String(mounted.track.trackId)!==requestTrack||String(track?.id||"")!==requestTrack)return;
      const title=track?.title||mounted.track.title;
      const artist=track?.user?.name||track?.user?.handle||mounted.track.subtitle;
      mounted.title.textContent=title;
      mounted.artist.textContent=artist;
      const artwork=track?.artwork?._480x480||track?.artwork?.["480x480"]||track?.artwork?._150x150||track?.artwork?.["150x150"];
      if(artwork){
        mounted.art.src=artwork;
        mounted.art.alt=title+" artwork";
        mounted.art.addEventListener("load",()=>mounted?.artWrap?.classList.add("hasArtwork"),{once:true});
      }
    }catch(error){
      console.info("[Career Mode Showdown] Audius metadata unavailable; fallback track presentation retained.",error);
    }
  }
  function audiusBuild(host,tile,track){
    const rootNode=root.document.createElement("div");
    rootNode.className="audiusMenuPlayer";
    rootNode.dataset.audiusState="ready";

    const artWrap=root.document.createElement("div");
    artWrap.className="audiusArtwork";
    const art=root.document.createElement("img");
    art.decoding="async";art.loading="lazy";art.alt="";
    const fallback=root.document.createElement("span");
    fallback.className="audiusArtworkFallback";fallback.textContent="A";
    artWrap.append(fallback,art);

    const core=root.document.createElement("div");
    core.className="audiusPlayerCore";
    const provider=root.document.createElement("div");
    provider.className="audiusProviderLine";
    const providerName=root.document.createElement("span");
    providerName.textContent="AUDIUS";
    const providerMeta=root.document.createElement("small");
    providerMeta.textContent="OPEN AUDIO · FREE STREAM";
    provider.append(providerName,providerMeta);

    const title=root.document.createElement("strong");
    title.className="audiusTrackTitle";title.textContent=track.title;
    const artist=root.document.createElement("span");
    artist.className="audiusTrackArtist";artist.textContent=track.subtitle;

    const wave=root.document.createElement("div");
    wave.className="audiusWaveform";wave.setAttribute("aria-hidden","true");
    const bars=root.document.createElement("span");bars.className="audiusWaveformBars";
    const progress=root.document.createElement("span");progress.className="audiusWaveformProgress";
    wave.append(bars,progress);

    const footer=root.document.createElement("div");
    footer.className="audiusPlayerFooter";
    const status=root.document.createElement("span");
    status.className="audiusPlayerStatus";status.textContent="READY";
    const time=root.document.createElement("span");
    time.className="audiusPlayerTime";time.textContent="0:00 / --:--";
    const link=root.document.createElement("a");
    link.className="audiusPlayerLink";link.href="https://audius.co";link.target="_blank";link.rel="noopener noreferrer";
    link.textContent="AUDIUS ↗";link.setAttribute("aria-label","Open Audius in a new tab");
    footer.append(status,time,link);
    core.append(provider,title,artist,wave,footer);

    const audio=root.document.createElement("audio");
    audio.className="audiusAudioElement";
    audio.preload="none";audio.playsInline=true;
    const streamUrl=audiusEndpoint("/tracks/"+encodeURIComponent(track.trackId)+"/stream");

    rootNode.append(artWrap,core,audio);
    host.replaceChildren(rootNode);
    tile.dataset.mediaLoaded="true";
    tile.dataset.mediaProvider="audius";
    mounted={host,tile,track,root:rootNode,artWrap,art,title,artist,progress,status,time,audio,streamUrl,phase:"ready",metadataRequested:false};

    audio.addEventListener("play",()=>{
      if(!audiusIsMounted()||mounted.audio!==audio)return;
      mounted.phase="playing";rootNode.dataset.audiusState="playing";status.textContent="PLAYING";audiusSyncControls();
      void audiusHydrateMetadata();
    });
    audio.addEventListener("pause",()=>{
      if(!audiusIsMounted()||mounted.audio!==audio||audio.ended)return;
      mounted.phase="paused";rootNode.dataset.audiusState="paused";status.textContent="PAUSED";audiusSyncControls();
    });
    audio.addEventListener("ended",()=>{
      if(!audiusIsMounted()||mounted.audio!==audio)return;
      mounted.phase="ended";rootNode.dataset.audiusState="ended";status.textContent="ENDED";audio.currentTime=0;audiusUpdateProgress();audiusSyncControls();
    });
    audio.addEventListener("timeupdate",updateProgress);
    audio.addEventListener("loadedmetadata",updateProgress);
    audio.addEventListener("volumechange",syncControls);
    audio.addEventListener("error",()=>audiusFail("The Audius stream could not be played. Try again or choose another soundtrack source.",audio.error));
    audiusSyncControls();
    return true;
  }
  function audiusActivate(track){
    if(!root.document||!track?.trackId)return false;
    audiusEnsureStyle();
    const host=root.document.getElementById("menuMusicPlayer");
    const tile=root.document.querySelector(".menuMusicTile");
    if(!host||!tile)return false;
    if(audiusIsMounted()&&mounted.host===host&&String(mounted.track.trackId)===String(track.trackId)){
      mounted.track=track;audiusSyncControls();return true;
    }
    audiusDestroy();
    return audiusBuild(host,tile,track);
  }
  async function audiusPlay(){
    if(!audiusIsMounted())return false;
    mounted.phase="loading";mounted.root.dataset.audiusState="loading";mounted.status.textContent="CONNECTING";audiusSyncControls();
    try{
      if(!mounted.audio.getAttribute("src"))mounted.audio.src=mounted.streamUrl;
      const result=mounted.audio.audiusPlay();
      if(result&&typeof result.then==="function")await result;
      void audiusHydrateMetadata();
      return true;
    }catch(error){
      audiusFail("Audius playback was blocked or unavailable. Press Play to try again.",error);
      return false;
    }
  }
  function audiusPause(){
    if(!audiusIsMounted())return false;
    mounted.audio.audiusPause();
    return true;
  }
  async function audiusToggle(){
    if(!audiusIsMounted())return false;
    return audiusIsPlaying()?audiusPause():audiusPlay();
  }
  function audiusSetMuted(value){
    if(!audiusIsMounted())return false;
    mounted.audio.muted=Boolean(value);
    audiusSyncControls();
    return true;
  }
  function audiusToggleMute(){
    if(!audiusIsMounted())return false;
    return audiusSetMuted(!mounted.audio.muted);
  }
  function audiusDestroy(){
    if(!mounted)return;
    const previous=mounted;
    mounted=null;
    try{previous.audio.audiusPause();previous.audio.removeAttribute("src");previous.audio.load();}catch(_error){}
    previous.root.remove();
    if(previous.tile?.dataset?.mediaProvider==="audius"){
      delete previous.tile.dataset.mediaLoaded;
      delete previous.tile.dataset.mediaProvider;
    }
  }

  root.CareerModeAudiusPlayer=Object.freeze({
    activate,play,pause,toggle,setMuted,toggleMute,destroy,isMounted,isPlaying,syncControls,getState:snapshot,
    diagnostics:()=>({provider:"audius",apiBase:API_BASE,appName:APP_NAME,trackId:mounted?.track?.trackId||null,secretFree:true,lazyStyle:Boolean(root.document?.querySelector('link[data-audius-player-style="true"]'))})
  });
})(window);
