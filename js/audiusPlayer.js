(function(root){
"use strict";

const API_BASE="https://api.audius.co/v1";
const TRENDING_QUERY="genre=Electronic&time=week&limit=12";
const REQUEST_TIMEOUT_MS=8000;

function fail(code,message){
    const error=new Error(message);
    error.code=code;
    throw error;
}

function normalizeTrack(track){
    if(!track||typeof track!=="object")return null;
    const id=String(track.id||"").trim();
    if(!id)return null;
    const streamable=track.isStreamable;
    if(streamable===false||String(streamable).toLowerCase()==="false")return null;
    const artwork=track.artwork||{};
    const artworkUrl=artwork._480x480||artwork["480x480"]||artwork._150x150||artwork["150x150"]||"";
    const user=track.user||{};
    return Object.freeze({
        id,
        title:String(track.title||"Audius Track").trim()||"Audius Track",
        artist:String(user.name||user.handle||"Audius Artist").trim()||"Audius Artist",
        artworkUrl:String(artworkUrl||"").trim(),
        permalink:String(track.permalink||"").trim(),
        duration:Number.isFinite(Number(track.duration))?Math.max(0,Number(track.duration)):0
    });
}

async function fetchTrendingTrack(signal){
    const controller=new AbortController();
    const abort=()=>controller.abort();
    if(signal){
        if(signal.aborted)controller.abort();
        else signal.addEventListener("abort",abort,{once:true});
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
        const tracks=Array.isArray(payload?.data)?payload.data:[];
        const track=tracks.map(normalizeTrack).find(Boolean);
        if(!track)fail("AUDIUS_NO_STREAMABLE_TRACK","Audius did not return a public streamable track.");
        return track;
    }catch(error){
        if(error?.name==="AbortError")fail("AUDIUS_REQUEST_TIMEOUT","Audius took too long to respond.");
        throw error;
    }finally{
        root.clearTimeout(timeout);
        if(signal)signal.removeEventListener("abort",abort);
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

    const ui=buildStage(host,track);
    const audio=createAudio(track);
    host.append(audio);
    audio.muted=Boolean(options.muted);

    let destroyed=false;
    let state="ready";
    const onState=typeof options.onState==="function"?options.onState:()=>{};
    const onProgress=typeof options.onProgress==="function"?options.onProgress:()=>{};

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
        ui.fill.style.width=`${(ratio*100).toFixed(2)}%`;
        ui.wave.setAttribute("aria-valuenow",String(Math.round(ratio*100)));
        ui.time.textContent=`${formatClock(current)} / ${formatClock(duration)}`;
        onProgress(Object.freeze({currentTime:current,duration,ratio}));
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
            try{
                await audio.play();
                publish("playing");
                return true;
            }catch(error){
                publish("error",{message:error?.message||"Audius playback could not start."});
                throw error;
            }
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

root.CareerModeAudiusMenuPlayer=Object.freeze({
    create,
    diagnostics:Object.freeze({
        apiBase:API_BASE,
        publicReadOnly:true,
        bearerTokenRequired:false,
        lazyMetadata:true,
        autoplay:false
    })
});
})(window);
