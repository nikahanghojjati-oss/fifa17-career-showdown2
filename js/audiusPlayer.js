(function(root){
"use strict";

const API_BASE="https://api.audius.co/v1";
const TRENDING_QUERY="genre=Electronic&time=week&limit=12";
const REQUEST_TIMEOUT_MS=8000;
let active=false;
let player=null;
let preparePromise=null;
let requestController=null;
let playing=false;
let muted=false;
let lastError="";

function fail(code,message){
    const error=new Error(message);
    error.code=code;
    throw error;
}

function ui(){
    return {
        tile:root.document?.querySelector(".menuMusicTile")||null,
        host:root.document?.getElementById("menuMusicPlayer")||null,
        category:root.document?.querySelector(".menuMusicHeader span")||null,
        title:root.document?.querySelector(".menuMusicHeader strong")||null,
        artist:root.document?.querySelector(".menuMusicArtist")||null,
        source:root.document?.querySelector(".menuMusicSource")||null,
        status:root.document?.getElementById("menuMusicStatus")||null,
        toggle:root.document?.getElementById("menuMusicToggle")||null,
        mute:root.document?.getElementById("menuMusicMute")||null
    };
}
function text(node,value){if(node)node.textContent=String(value??"");}
function normalizeTrack(track){
    if(!track||typeof track!=="object")return null;
    const id=String(track.id||"").trim();
    if(!id)return null;
    const streamable=track.is_streamable??track.isStreamable;
    if(streamable===false||String(streamable).toLowerCase()==="false")return null;
    const artwork=track.artwork||{};
    const user=track.user||{};
    return Object.freeze({
        id,
        title:String(track.title||"Audius Track").trim()||"Audius Track",
        artist:String(user.name||user.handle||"Audius Artist").trim()||"Audius Artist",
        artworkUrl:String(artwork["480x480"]||artwork._480x480||artwork["150x150"]||artwork._150x150||"").trim(),
        permalink:String(track.permalink||"").trim(),
        duration:Number.isFinite(Number(track.duration))?Math.max(0,Number(track.duration)):0
    });
}
async function fetchTrendingTrack(signal){
    const controller=new AbortController();
    const forwardAbort=()=>controller.abort();
    if(signal){
        if(signal.aborted)controller.abort();
        else signal.addEventListener("abort",forwardAbort,{once:true});
    }
    const timeout=root.setTimeout(()=>controller.abort(),REQUEST_TIMEOUT_MS);
    try{
        const response=await root.fetch(`${API_BASE}/tracks/trending?${TRENDING_QUERY}`,{
            method:"GET",
            headers:{Accept:"application/json"},
            signal:controller.signal,
            credentials:"omit",
            referrerPolicy:"no-referrer"
        });
        if(!response.ok)fail("AUDIUS_METADATA_FAILED",`Audius returned HTTP ${response.status}.`);
        const payload=await response.json();
        const track=(Array.isArray(payload?.data)?payload.data:[]).map(normalizeTrack).find(Boolean);
        if(!track)fail("AUDIUS_NO_STREAMABLE_TRACK","Audius did not return a public streamable track.");
        return track;
    }catch(error){
        if(error?.name==="AbortError")fail("AUDIUS_REQUEST_TIMEOUT","Audius took too long to respond.");
        throw error;
    }finally{
        root.clearTimeout(timeout);
        if(signal)signal.removeEventListener("abort",forwardAbort);
    }
}
function formatClock(value){
    const seconds=Math.max(0,Math.floor(Number(value)||0));
    return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,"0")}`;
}
function buildStage(host,track){
    host.replaceChildren();
    const stage=root.document.createElement("div");
    stage.className="menuAudiusStage";
    stage.dataset.audiusTrackId=track.id;

    const artWrap=root.document.createElement("div");
    artWrap.className="menuAudiusArtworkWrap";
    if(track.artworkUrl){
        const image=root.document.createElement("img");
        image.className="menuAudiusArtwork";
        image.src=track.artworkUrl;
        image.alt=`Artwork for ${track.title} by ${track.artist}`;
        image.loading="lazy";
        image.decoding="async";
        image.referrerPolicy="no-referrer";
        artWrap.append(image);
    }else{
        const fallback=root.document.createElement("span");
        fallback.className="menuAudiusArtworkFallback";
        fallback.textContent="A";
        fallback.setAttribute("aria-hidden","true");
        artWrap.append(fallback);
    }

    const detail=root.document.createElement("div");
    detail.className="menuAudiusDetail";
    const badge=root.document.createElement("span");
    badge.className="menuAudiusBadge";
    badge.textContent="AUDIUS";
    const title=root.document.createElement("strong");
    title.className="menuAudiusTrackTitle";
    title.textContent=track.title;
    const artist=root.document.createElement("span");
    artist.className="menuAudiusTrackArtist";
    artist.textContent=track.artist;
    const wave=root.document.createElement("div");
    wave.className="menuAudiusWave";
    wave.setAttribute("role","progressbar");
    wave.setAttribute("aria-label",`Playback progress for ${track.title}`);
    wave.setAttribute("aria-valuemin","0");
    wave.setAttribute("aria-valuemax","100");
    wave.setAttribute("aria-valuenow","0");
    const fill=root.document.createElement("span");
    fill.className="menuAudiusWaveFill";
    wave.append(fill);
    const time=root.document.createElement("span");
    time.className="menuAudiusTime";
    time.textContent=`0:00 / ${formatClock(track.duration)}`;
    detail.append(badge,title,artist,wave,time);
    stage.append(artWrap,detail);
    host.append(stage);
    return {stage,wave,fill,time};
}
function createAudio(track){
    const audio=root.document.createElement("audio");
    audio.className="menuAudiusAudio";
    audio.preload="metadata";
    audio.playsInline=true;
    audio.src=`${API_BASE}/tracks/${encodeURIComponent(track.id)}/stream`;
    audio.setAttribute("aria-hidden","true");
    return audio;
}
async function create(options={}){
    const host=options.host;
    if(!(host instanceof Element))fail("AUDIUS_HOST_REQUIRED","Audius player host is unavailable.");
    const signal=options.signal||null;
    const track=await fetchTrendingTrack(signal);
    if(signal?.aborted)fail("AUDIUS_ABORTED","Audius player preparation was cancelled.");

    const stage=buildStage(host,track);
    const audio=createAudio(track);
    host.append(audio);
    audio.muted=Boolean(options.muted);
    let destroyed=false;
    let state="ready";
    const onState=typeof options.onState==="function"?options.onState:()=>{};

    const publish=(next,detail={})=>{
        if(destroyed)return;
        state=next;
        onState(Object.freeze({state:next,track,...detail}));
    };
    const renderProgress=()=>{
        if(destroyed)return;
        const duration=Number.isFinite(audio.duration)&&audio.duration>0?audio.duration:track.duration;
        const current=Math.max(0,Number(audio.currentTime)||0);
        const ratio=duration>0?Math.min(1,current/duration):0;
        stage.fill.style.width=`${(ratio*100).toFixed(2)}%`;
        stage.wave.setAttribute("aria-valuenow",String(Math.round(ratio*100)));
        stage.time.textContent=`${formatClock(current)} / ${formatClock(duration)}`;
    };
    audio.addEventListener("playing",()=>publish("playing"));
    audio.addEventListener("pause",()=>{if(!audio.ended)publish("paused");});
    audio.addEventListener("waiting",()=>publish("buffering"));
    audio.addEventListener("ended",()=>{renderProgress();publish("ended");});
    audio.addEventListener("timeupdate",renderProgress);
    audio.addEventListener("durationchange",renderProgress);
    audio.addEventListener("error",()=>publish("error",{message:"Audius stream could not be played."}));
    renderProgress();
    onState(Object.freeze({state:"ready",track}));

    return Object.freeze({
        provider:"audius",
        track,
        async play(){
            if(destroyed)fail("AUDIUS_PLAYER_DESTROYED","Audius player is no longer available.");
            await audio.play();
            publish("playing");
            return true;
        },
        pause(){
            if(destroyed)return false;
            audio.pause();
            publish("paused");
            return true;
        },
        setMuted(value){
            if(destroyed)return false;
            audio.muted=Boolean(value);
            publish(state,{muted:audio.muted});
            return true;
        },
        isReady(){return !destroyed;},
        destroy(){
            if(destroyed)return;
            destroyed=true;
            try{audio.pause();}catch(_error){}
            audio.removeAttribute("src");
            try{audio.load();}catch(_error){}
            host.replaceChildren();
        }
    });
}
function renderShellState(state){
    const view=ui();
    if(!view.tile)return;
    view.tile.dataset.mediaProvider="audius";
    text(view.source,"AUDIUS");
    if(state==="loading"){
        delete view.tile.dataset.mediaLoaded;
        text(view.category,"AUDIUS · MATCHDAY RADIO");
        text(view.title,"MATCHDAY RADIO");
        text(view.artist,"Finding a free Electronic track");
        text(view.status,"AUDIUS · FINDING A MATCHDAY TRACK");
        text(view.toggle,"LOADING AUDIUS");
        if(view.toggle)view.toggle.disabled=true;
        if(view.mute)view.mute.disabled=true;
        return;
    }
    if(state==="error"){
        delete view.tile.dataset.mediaLoaded;
        text(view.status,"AUDIUS UNAVAILABLE · PRESS RETRY");
        text(view.toggle,"RETRY AUDIUS");
        if(view.toggle)view.toggle.disabled=false;
        if(view.mute)view.mute.disabled=true;
        return;
    }
    if(player?.track){
        view.tile.dataset.mediaLoaded="true";
        text(view.category,"AUDIUS · MATCHDAY RADIO");
        text(view.title,player.track.title);
        text(view.artist,player.track.artist);
        text(view.status,state==="buffering"?"AUDIUS · BUFFERING":playing?(muted?"AUDIUS · PLAYING · MUTED":"AUDIUS · PLAYING"):"AUDIUS · READY · PRESS PLAY");
        text(view.toggle,playing?"PAUSE TRACK":"PLAY TRACK");
        text(view.mute,muted?"UNMUTE":"MUTE");
        if(view.toggle)view.toggle.disabled=false;
        if(view.mute)view.mute.disabled=false;
    }
}
function handleState(detail){
    const state=detail?.state||"ready";
    if(state==="playing")playing=true;
    if(["paused","ended","error"].includes(state))playing=false;
    if(state==="error")lastError=detail?.message||"Audius playback could not continue.";
    renderShellState(state==="error"?"error":state);
}
async function activate(){
    active=true;
    if(player?.isReady()){renderShellState(playing?"playing":"ready");return true;}
    if(preparePromise)return preparePromise;

    const view=ui();
    if(!view.host)fail("AUDIUS_HOST_REQUIRED","Audius player host is unavailable.");
    if(typeof root.loadRuntimeStyle!=="function")fail("AUDIUS_STYLE_LOADER_UNAVAILABLE","Audius styling could not be loaded.");
    lastError="";
    renderShellState("loading");
    const placeholder=root.document.createElement("p");
    placeholder.className="menuMusicPlaceholder";
    placeholder.textContent="Finding a free Audius matchday track…";
    view.host.replaceChildren(placeholder);

    requestController?.abort();
    const controller=new AbortController();
    requestController=controller;
    preparePromise=(async()=>{
        try{
            await root.loadRuntimeStyle("audius-menu-player","css/audiusPlayer.css");
            if(!active||controller.signal.aborted)return false;
            const next=await create({host:view.host,signal:controller.signal,muted,onState:handleState});
            if(!active||controller.signal.aborted){next.destroy();return false;}
            player=next;
            renderShellState("ready");
            return true;
        }catch(error){
            if(!active||controller.signal.aborted)return false;
            lastError=error?.message||"Audius could not load a track.";
            const retry=root.document.createElement("p");
            retry.className="menuMusicPlaceholder";
            retry.textContent="Audius is temporarily unavailable. Press Retry Audius or choose another track.";
            view.host.replaceChildren(retry);
            renderShellState("error");
            throw error;
        }finally{
            if(requestController===controller)requestController=null;
            preparePromise=null;
        }
    })();
    return preparePromise;
}
function deactivate(){
    active=false;
    requestController?.abort();
    requestController=null;
    preparePromise=null;
    if(player){try{player.destroy();}catch(_error){}}
    player=null;
    playing=false;
    lastError="";
    const view=ui();
    if(view.tile){
        delete view.tile.dataset.mediaProvider;
        delete view.tile.dataset.mediaLoaded;
    }
    text(view.source,"YOUTUBE");
    return true;
}
async function toggle(){
    if(!active||!player?.isReady()){
        try{await activate();}catch(_error){}
        return false;
    }
    try{
        if(playing){player.pause();playing=false;}
        else{await player.play();playing=true;}
        renderShellState(playing?"playing":"paused");
        return true;
    }catch(error){
        playing=false;
        lastError=error?.message||"Audius playback could not start.";
        renderShellState("error");
        return false;
    }
}
function toggleMute(){
    if(!active||!player?.isReady())return false;
    muted=!muted;
    player.setMuted(muted);
    renderShellState(playing?"playing":"ready");
    return true;
}

root.CareerModeAudiusMenuPlayer=Object.freeze({
    activate,deactivate,toggle,toggleMute,
    isActive:()=>active,
    isPlaying:()=>playing,
    getState:()=>Object.freeze({active,playing,muted,loading:Boolean(preparePromise),error:lastError,track:player?.track||null}),
    diagnostics:Object.freeze({
        apiBase:API_BASE,
        publicReadOnly:true,
        bearerTokenRequired:false,
        lazyMetadata:true,
        autoplay:false
    })
});
})(window);
