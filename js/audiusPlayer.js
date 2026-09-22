(function(root){
  "use strict";

  const API_BASE="https://api.audius.co/v1";
  const APP_NAME="CareerModeShowdown17";
  let mounted=null;

  function endpoint(path){
    const join=path.includes("?")?"&":"?";
    return API_BASE+path+join+"app_name="+encodeURIComponent(APP_NAME);
  }
  function formatTime(value){
    const seconds=Math.max(0,Math.floor(Number(value)||0));
    return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,"0")}`;
  }
  function stateSnapshot(){
    if(!mounted)return {mounted:false,playing:false,muted:false,phase:"idle"};
    return {mounted:true,playing:!mounted.audio.paused,muted:mounted.audio.muted,phase:mounted.phase};
  }
  function notify(){
    mounted?.onStateChange?.(stateSnapshot());
  }
  function fail(message,error){
    if(!mounted)return;
    mounted.phase="error";
    mounted.root.dataset.audiusState="error";
    mounted.status.textContent="STREAM UNAVAILABLE";
    mounted.onError?.(message);
    console.warn("[Career Mode Showdown] Audius player:",error||message);
    notify();
  }
  function updateProgress(){
    if(!mounted)return;
    const duration=Number(mounted.audio.duration);
    const current=Number(mounted.audio.currentTime)||0;
    const pct=Number.isFinite(duration)&&duration>0?Math.max(0,Math.min(100,current/duration*100)):0;
    mounted.progress.style.width=pct+"%";
    mounted.time.textContent=`${formatTime(current)} / ${Number.isFinite(duration)&&duration>0?formatTime(duration):"--:--"}`;
  }
  async function hydrateMetadata(){
    if(!mounted||mounted.metadataRequested)return;
    mounted.metadataRequested=true;
    try{
      const response=await fetch(endpoint(`/tracks/${encodeURIComponent(mounted.track.trackId)}`),{
        method:"GET",credentials:"omit",mode:"cors",cache:"default"
      });
      if(!response.ok)throw new Error(`AUDIUS_METADATA_${response.status}`);
      const payload=await response.json(),track=payload?.data||payload;
      if(!mounted||String(track?.id||"")!==String(mounted.track.trackId))return;
      const title=track?.title||mounted.track.title;
      const artist=track?.user?.name||track?.user?.handle||mounted.track.subtitle;
      mounted.title.textContent=title;
      mounted.artist.textContent=artist;
      const artwork=track?.artwork?._480x480||track?.artwork?.["480x480"]||track?.artwork?._150x150||track?.artwork?.["150x150"];
      if(artwork){
        mounted.art.src=artwork;
        mounted.art.alt=`${title} artwork`;
        mounted.art.addEventListener("load",()=>mounted?.artWrap?.classList.add("hasArtwork"),{once:true});
      }
    }catch(error){
      console.info("[Career Mode Showdown] Audius metadata unavailable; fallback track presentation retained.",error);
    }
  }
  function build({host,tile,track,onStateChange,onError}){
    const rootNode=document.createElement("div");
    rootNode.className="audiusMenuPlayer";
    rootNode.dataset.audiusState="ready";

    const artWrap=document.createElement("div");
    artWrap.className="audiusArtwork";
    const art=document.createElement("img");
    art.decoding="async";art.loading="lazy";art.alt="";
    const fallback=document.createElement("span");
    fallback.className="audiusArtworkFallback";fallback.textContent="A";
    artWrap.append(fallback,art);

    const core=document.createElement("div");
    core.className="audiusPlayerCore";
    const provider=document.createElement("div");
    provider.className="audiusProviderLine";
    provider.innerHTML="<span>AUDIUS</span><small>OPEN AUDIO · FREE STREAM</small>";
    const title=document.createElement("strong");
    title.className="audiusTrackTitle";title.textContent=track.title;
    const artist=document.createElement("span");
    artist.className="audiusTrackArtist";artist.textContent=track.subtitle;

    const wave=document.createElement("div");
    wave.className="audiusWaveform";wave.setAttribute("aria-hidden","true");
    const bars=document.createElement("span");bars.className="audiusWaveformBars";
    const progress=document.createElement("span");progress.className="audiusWaveformProgress";
    wave.append(bars,progress);

    const footer=document.createElement("div");
    footer.className="audiusPlayerFooter";
    const status=document.createElement("span");
    status.className="audiusPlayerStatus";status.textContent="READY";
    const time=document.createElement("span");
    time.className="audiusPlayerTime";time.textContent="0:00 / --:--";
    const link=document.createElement("a");
    link.className="audiusPlayerLink";link.href="https://audius.co";link.target="_blank";link.rel="noopener noreferrer";
    link.textContent="AUDIUS ↗";link.setAttribute("aria-label","Open Audius in a new tab");
    footer.append(status,time,link);
    core.append(provider,title,artist,wave,footer);

    const audio=document.createElement("audio");
    audio.className="audiusAudioElement";
    audio.preload="none";audio.playsInline=true;
    audio.src=endpoint(`/tracks/${encodeURIComponent(track.trackId)}/stream`);

    rootNode.append(artWrap,core,audio);
    host.replaceChildren(rootNode);
    tile.dataset.mediaLoaded="true";
    tile.dataset.mediaProvider="audius";

    mounted={host,tile,track,onStateChange,onError,root:rootNode,artWrap,art,title,artist,progress,status,time,audio,phase:"ready",metadataRequested:false};

    audio.addEventListener("play",()=>{
      if(!mounted||mounted.audio!==audio)return;
      mounted.phase="playing";rootNode.dataset.audiusState="playing";status.textContent="PLAYING";notify();
      void hydrateMetadata();
    });
    audio.addEventListener("pause",()=>{
      if(!mounted||mounted.audio!==audio||audio.ended)return;
      mounted.phase="paused";rootNode.dataset.audiusState="paused";status.textContent="PAUSED";notify();
    });
    audio.addEventListener("ended",()=>{
      if(!mounted||mounted.audio!==audio)return;
      mounted.phase="ended";rootNode.dataset.audiusState="ended";status.textContent="ENDED";audio.currentTime=0;updateProgress();notify();
    });
    audio.addEventListener("timeupdate",updateProgress);
    audio.addEventListener("loadedmetadata",updateProgress);
    audio.addEventListener("volumechange",notify);
    audio.addEventListener("error",()=>fail("The Audius stream could not be played. Try again or choose another soundtrack source.",audio.error));
    notify();
    return mounted;
  }

  function mount(options){
    if(!options?.host||!options?.tile||!options?.track?.trackId)return false;
    if(mounted&&mounted.host===options.host&&mounted.track.trackId===options.track.trackId){
      mounted.onStateChange=options.onStateChange;mounted.onError=options.onError;notify();return true;
    }
    destroy();
    build(options);
    return true;
  }
  async function play(){
    if(!mounted)return false;
    mounted.phase="loading";mounted.root.dataset.audiusState="loading";mounted.status.textContent="CONNECTING";notify();
    try{
      const result=mounted.audio.play();
      if(result&&typeof result.then==="function")await result;
      void hydrateMetadata();
      return true;
    }catch(error){
      fail("Audius playback was blocked or unavailable. Press Play to try again.",error);
      return false;
    }
  }
  function pause(){
    if(!mounted)return false;
    mounted.audio.pause();
    return true;
  }
  function setMuted(value){
    if(!mounted)return false;
    mounted.audio.muted=Boolean(value);
    notify();
    return true;
  }
  function destroy(){
    if(!mounted)return;
    const previous=mounted;
    mounted=null;
    try{previous.audio.pause();previous.audio.removeAttribute("src");previous.audio.load();}catch(_error){}
    previous.root.remove();
    if(previous.tile?.dataset?.mediaProvider==="audius")delete previous.tile.dataset.mediaLoaded;
  }
  function isMounted(){return Boolean(mounted);}

  root.CareerModeAudiusPlayer=Object.freeze({
    mount,play,pause,setMuted,destroy,isMounted,getState:stateSnapshot,
    diagnostics:()=>({provider:"audius",apiBase:API_BASE,appName:APP_NAME,trackId:mounted?.track?.trackId||null,secretFree:true})
  });
})(window);
