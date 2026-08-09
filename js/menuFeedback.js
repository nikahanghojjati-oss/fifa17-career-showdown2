/* Original Web Audio micro-feedback. No recorded or third-party sound asset is used. */

const MENU_FEEDBACK_COOLDOWN_MS = 110;
const MENU_FEEDBACK_MAX_RESUME_DELAY_MS = 180;
const MENU_FEEDBACK_DURATION_SECONDS = 0.064;

let menuFeedbackAudioContext = null;
let lastMenuFeedbackCueAt = -Infinity;
let menuFeedbackVisibilityBound = false;

function getMenuFeedbackSynthesisClock(){
    return typeof performance !== "undefined" && typeof performance.now === "function"
        ? performance.now()
        : Date.now();
}

function isMenuFeedbackCueAllowed(){
    if(document.visibilityState === "hidden"){
        return false;
    }
    if(typeof window.isMenuFeedbackEnabled === "function" && !window.isMenuFeedbackEnabled()){
        return false;
    }
    return !(typeof window.isMenuMediaPlaying === "function" && window.isMenuMediaPlaying());
}

function getMenuFeedbackAudioContext(){
    if(menuFeedbackAudioContext && menuFeedbackAudioContext.state !== "closed"){
        return menuFeedbackAudioContext;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if(typeof AudioContextClass !== "function"){
        return null;
    }

    try{
        menuFeedbackAudioContext = new AudioContextClass({ latencyHint: "interactive" });
    }catch(error){
        try{ menuFeedbackAudioContext = new AudioContextClass(); }
        catch(fallbackError){ menuFeedbackAudioContext = null; }
    }
    return menuFeedbackAudioContext;
}

function synthesizeMenuFeedbackCue(context){
    const start = context.currentTime;
    const end = start + MENU_FEEDBACK_DURATION_SECONDS;
    const master = context.createGain();
    const body = context.createOscillator();
    const detail = context.createOscillator();
    const detailLevel = context.createGain();

    body.type = "triangle";
    body.frequency.setValueAtTime(660, start);
    body.frequency.exponentialRampToValueAtTime(930, start + 0.046);
    detail.type = "sine";
    detail.frequency.setValueAtTime(1320, start);
    detail.frequency.exponentialRampToValueAtTime(1080, start + 0.038);
    detailLevel.gain.setValueAtTime(0.22, start);

    master.gain.setValueAtTime(0.0001, start);
    master.gain.exponentialRampToValueAtTime(0.024, start + 0.006);
    master.gain.exponentialRampToValueAtTime(0.0001, end);

    body.connect(master);
    detail.connect(detailLevel);
    detailLevel.connect(master);
    master.connect(context.destination);
    body.start(start);
    detail.start(start);
    body.stop(end);
    detail.stop(end);

    detail.addEventListener("ended", () => {
        body.disconnect();
        detail.disconnect();
        detailLevel.disconnect();
        master.disconnect();
    }, { once: true });
}

function playMenuFeedbackCue(){
    if(!isMenuFeedbackCueAllowed()){
        return false;
    }

    const requestedAt = getMenuFeedbackSynthesisClock();
    if(requestedAt - lastMenuFeedbackCueAt < MENU_FEEDBACK_COOLDOWN_MS){
        return false;
    }
    lastMenuFeedbackCueAt = requestedAt;

    const context = getMenuFeedbackAudioContext();
    if(!context){
        return false;
    }

    const emit = () => {
        if(context.state !== "running" || !isMenuFeedbackCueAllowed()){
            return false;
        }
        try{
            synthesizeMenuFeedbackCue(context);
            return true;
        }catch(error){
            return false;
        }
    };

    if(context.state !== "running"){
        try{
            Promise.resolve(context.resume()).then(() => {
                if(getMenuFeedbackSynthesisClock() - requestedAt <= MENU_FEEDBACK_MAX_RESUME_DELAY_MS){
                    emit();
                }
            }).catch(() => {});
            return true;
        }catch(error){
            return false;
        }
    }

    return emit();
}

function suspendMenuFeedbackAudio(){
    if(menuFeedbackAudioContext && menuFeedbackAudioContext.state === "running"){
        try{ Promise.resolve(menuFeedbackAudioContext.suspend()).catch(() => {}); }
        catch(error){ /* Page visibility cleanup remains best-effort. */ }
    }
}

function getMenuFeedbackDiagnostics(){
    return {
        synthesis: "original-web-audio",
        supported: Boolean(window.AudioContext || window.webkitAudioContext),
        contextState: menuFeedbackAudioContext ? menuFeedbackAudioContext.state : "not-created",
        cooldownMs: MENU_FEEDBACK_COOLDOWN_MS
    };
}

if(!menuFeedbackVisibilityBound){
    menuFeedbackVisibilityBound = true;
    document.addEventListener("visibilitychange", () => {
        if(document.visibilityState === "hidden"){
            suspendMenuFeedbackAudio();
        }
    });
}

window.playMenuFeedbackCue = playMenuFeedbackCue;
window.suspendMenuFeedbackAudio = suspendMenuFeedbackAudio;
window.getMenuFeedbackDiagnostics = getMenuFeedbackDiagnostics;
