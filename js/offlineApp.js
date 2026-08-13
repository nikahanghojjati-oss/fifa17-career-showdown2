const OFFLINE_APP_REVISION=(()=>{
    const meta=document.querySelector('meta[name="app-asset-revision"]');
    return meta?.content?.trim()||"1.2.1-r1";
})();
const OFFLINE_MESSAGE_TIMEOUT_MS=4500;
const SAFE_UPDATE_SCREENS=new Set(["mainMenu","dashboard"]);
let offlineRegistration=null;
let deferredInstallPrompt=window.__cmsDeferredInstallPrompt||null;
let activationRequested=false;
let controllerReloaded=false;
let installPromptCaptured=Boolean(deferredInstallPrompt);
let installedStandalone=false;
let offlineReady=false;
let offlineRecoveryReady=false;
let lastCacheStatus=null;
let menuMediaStatusBeforeOffline="";
let verifiedConnectivity=navigator.onLine===false?"offline":"online";
let connectivityVerified=navigator.onLine===false;
let connectivityProbeGeneration=0;

function isStandaloneDisplay(){
    return Boolean(
        (typeof matchMedia==="function"&&matchMedia("(display-mode: standalone)").matches)
        || navigator.standalone===true
    );
}

function isServiceWorkerSupported(){ return "serviceWorker" in navigator; }
function isOffline(){ return verifiedConnectivity==="offline"; }
function getActiveApplicationScreen(){
    return typeof window.getActiveScreenName==="function"
        ? window.getActiveScreenName()
        : document.querySelector(".screen:not(.hidden)")?.id||"";
}

function getUpdateBoundaryStatus(){
    const screen=getActiveApplicationScreen();
    const recoveryBusy=Boolean(document.querySelector('[data-transaction-busy="true"],[data-critical-recovery="true"]'));
    const uiBusy=Boolean(document.querySelector('[aria-busy="true"]:not(#loadingScreen)'));
    return{
        safe:SAFE_UPDATE_SCREENS.has(screen)&&!recoveryBusy&&!uiBusy,
        screen,
        recoveryBusy,
        uiBusy
    };
}

function getInstallGuidance(){
    const ua=navigator.userAgent||"";
    const isiOS=/iPad|iPhone|iPod/i.test(ua)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
    if(isiOS){
        return "In Safari, open Share and choose Add to Home Screen. Career Mode Showdown will launch like an app and can reopen its verified local shell offline.";
    }
    if(/Android|CrOS/i.test(ua)){
        return "Use Install app from the browser address bar or menu when offered. Career Mode Showdown keeps tracker data local to this device.";
    }
    return "Use your browser's Install app or Add to Home Screen command when available. Installation support and wording vary by browser.";
}

function getOfflineAppSettingsState(){
    installedStandalone=isStandaloneDisplay();
    const supported=isServiceWorkerSupported();
    const offline=isOffline();
    const waitingUpdate=Boolean(offlineRegistration?.waiting);
    const installPromptAvailable=Boolean(deferredInstallPrompt&&!offline);

    let installationLabel="Browser install";
    let installActionLabel="SHOW INSTALL INSTRUCTIONS";
    let installActionDisabled=false;
    if(installedStandalone){
        installationLabel="Installed";
        installActionLabel="INSTALLED ON THIS DEVICE";
        installActionDisabled=true;
    }else if(installPromptAvailable){
        installationLabel="Ready to install";
        installActionLabel="INSTALL OFFLINE APP";
    }else if(!supported){
        installationLabel="Install support varies";
    }else if(offline){
        installationLabel="Install requires browser controls";
    }

    let shellLabel="Preparing offline shell";
    if(!supported){ shellLabel="Service worker unavailable"; }
    else if(offlineReady&&offlineRecoveryReady){ shellLabel="Recovery shell ready"; }
    else if(offlineReady){ shellLabel="Offline shell ready"; }

    return{
        supported,
        standalone:installedStandalone,
        connectivity:verifiedConnectivity,
        connectivityVerified,
        connectivityLabel:offline?"Offline":"Online",
        offlineReady:offlineReady&&connectivityVerified,
        offlineRecoveryReady,
        shellLabel,
        waitingUpdate,
        installPromptAvailable,
        installPromptCaptured,
        installationLabel,
        installActionLabel,
        installActionDisabled,
        updateActionLabel:"APPLY READY UPDATE",
        installGuidance:getInstallGuidance(),
        cacheStatus:lastCacheStatus
    };
}

function dispatchOfflineState(){
    window.dispatchEvent(new CustomEvent("career-mode-offline-state-change",{
        detail:getOfflineAppSettingsState()
    }));
}

function setMenuMediaOfflineState(offline){
    const toggle=document.getElementById("menuMusicToggle");
    const status=document.getElementById("menuMusicStatus");
    if(offline){
        try{
            if(window.isMenuMediaPlaying?.()&&toggle&&!toggle.disabled){ toggle.click(); }
        }catch(error){
            console.warn("[Career Mode Showdown] External media could not be paused while entering offline mode:",error);
        }
        if(status){
            if(!/^OFFLINE ·/.test(status.textContent||"")){
                menuMediaStatusBeforeOffline=status.textContent||menuMediaStatusBeforeOffline;
            }
            status.textContent="OFFLINE · YOUTUBE MEDIA REQUIRES A CONNECTION";
        }
        if(toggle){
            toggle.disabled=true;
            toggle.setAttribute("aria-disabled","true");
        }
        return;
    }
    if(toggle){
        toggle.disabled=false;
        toggle.removeAttribute("aria-disabled");
    }
    if(status&&menuMediaStatusBeforeOffline){ status.textContent=menuMediaStatusBeforeOffline; }
}

function renderConnectivity(){
    setMenuMediaOfflineState(isOffline());
    dispatchOfflineState();
}

function setConnectivityState(state,verified=true){
    verifiedConnectivity=state==="offline"?"offline":"online";
    connectivityVerified=Boolean(verified);
    renderConnectivity();
    return verifiedConnectivity;
}

function versionedLocalUrl(path){
    const url=new URL(path,location.href);
    url.searchParams.set("v",OFFLINE_APP_REVISION);
    return url.href;
}

function sendWorkerMessage(worker,type,payload={}){
    return new Promise((resolve,reject)=>{
        if(!worker){
            reject(new Error("No service worker is available for this request."));
            return;
        }
        const channel=new MessageChannel();
        const timeout=setTimeout(()=>{
            channel.port1.close();
            reject(new Error(`Service worker message timed out: ${type}`));
        },OFFLINE_MESSAGE_TIMEOUT_MS);
        channel.port1.onmessage=event=>{
            clearTimeout(timeout);
            channel.port1.close();
            resolve(event.data||{});
        };
        worker.postMessage({type,...payload},[channel.port2]);
    });
}

async function verifyNetworkConnectivity(){
    const generation=++connectivityProbeGeneration;
    if(navigator.onLine===false){
        setConnectivityState("offline",true);
        return false;
    }
    const worker=navigator.serviceWorker?.controller||offlineRegistration?.active;
    if(!worker){
        connectivityVerified=false;
        renderConnectivity();
        return false;
    }
    try{
        const response=await sendWorkerMessage(worker,"CMS_PROBE_NETWORK");
        const online=response?.type==="CMS_NETWORK_STATUS"&&response.online===true;
        if(generation===connectivityProbeGeneration){
            setConnectivityState(online?"online":"offline",true);
        }
        return online;
    }catch(error){
        if(generation===connectivityProbeGeneration){ setConnectivityState("offline",true); }
        return false;
    }
}

async function verifyOfflineReadiness(worker=offlineRegistration?.active||navigator.serviceWorker?.controller){
    if(!worker){
        offlineReady=false;
        offlineRecoveryReady=false;
        connectivityVerified=false;
        renderConnectivity();
        return false;
    }
    try{
        const response=await sendWorkerMessage(worker,"CMS_GET_CACHE_STATUS");
        lastCacheStatus=response;
        const currentReady=Boolean(response.current?.ok??response.ok);
        const previousReady=Boolean(response.previous?.ok);
        offlineReady=currentReady||previousReady;
        offlineRecoveryReady=!currentReady&&previousReady;
    }catch(error){
        offlineReady=false;
        offlineRecoveryReady=false;
        if(!isOffline()){
            console.warn("[Career Mode Showdown] Offline shell verification could not complete:",error);
        }
    }
    await verifyNetworkConnectivity();
    renderConnectivity();
    return offlineReady;
}

function markUpdateReady(){ dispatchOfflineState(); }

async function requestOfflineAppInstall(){
    installedStandalone=isStandaloneDisplay();
    if(installedStandalone){
        return{kind:"installed",message:"Career Mode Showdown is already installed on this device."};
    }
    if(deferredInstallPrompt&&!isOffline()){
        const prompt=deferredInstallPrompt;
        deferredInstallPrompt=null;
        dispatchOfflineState();
        try{
            await prompt.prompt();
            const choice=await prompt.userChoice;
            dispatchOfflineState();
            return{
                kind:choice?.outcome==="accepted"?"accepted":"dismissed",
                message:choice?.outcome==="accepted"
                    ? "Installation was accepted. Your browser will finish adding Career Mode Showdown."
                    : "Installation was not completed. You can try again from Settings when your browser offers it."
            };
        }catch(error){
            deferredInstallPrompt=prompt;
            dispatchOfflineState();
            window.reportApplicationError?.("The browser install prompt could not be opened",error);
            return{kind:"error",message:"The browser install prompt could not be opened."};
        }
    }
    return{kind:"guidance",message:getInstallGuidance()};
}

async function activateWaitingUpdate(){
    const waiting=offlineRegistration?.waiting;
    if(!waiting){
        markUpdateReady();
        return false;
    }
    const boundary=getUpdateBoundaryStatus();
    if(!boundary.safe){
        const message=boundary.recoveryBusy||boundary.uiBusy
            ? "Update is ready, but an application operation is still in progress. Finish it and return to Home or Showdown Home before updating."
            : "Update is ready. Return to Home or Showdown Home before applying it so unsaved form work is never discarded.";
        window.showAppNotice?.(message,"error",8000);
        return false;
    }
    try{
        const response=await sendWorkerMessage(waiting,"CMS_ACTIVATE_UPDATE",{
            pageRevision:OFFLINE_APP_REVISION,
            screen:boundary.screen
        });
        if(!response.ok||response.type!=="CMS_ACTIVATION_ACCEPTED"){
            const missing=Array.isArray(response.missing)&&response.missing.length
                ? `: ${response.missing.join(", ")}`
                : ".";
            throw new Error(response.error||`Cached update is incomplete${missing}`);
        }
        activationRequested=true;
        dispatchOfflineState();
        return true;
    }catch(error){
        dispatchOfflineState();
        window.reportApplicationError?.(
            "The update was not activated because its offline shell could not be verified",
            error
        );
        return false;
    }
}

async function requestPreviousRuntimeRollback(){
    const boundary=getUpdateBoundaryStatus();
    if(!boundary.safe){
        window.showAppNotice?.(
            "Return to Home or Showdown Home before reloading a previous offline version.",
            "error",
            7000
        );
        return false;
    }
    const worker=navigator.serviceWorker?.controller||offlineRegistration?.active;
    try{
        const response=await sendWorkerMessage(worker,"CMS_ROLLBACK_TO_PREVIOUS");
        if(!response.ok||response.type!=="CMS_ROLLBACK_ACCEPTED"){
            throw new Error(response.error||"No complete previous offline shell is available.");
        }
        location.reload();
        return true;
    }catch(error){
        window.reportApplicationError?.("A previous offline version could not be selected",error);
        return false;
    }
}

function observeRegistration(registration){
    offlineRegistration=registration;
    markUpdateReady();
    registration.addEventListener("updatefound",()=>{
        const installing=registration.installing;
        if(!installing){ return; }
        installing.addEventListener("statechange",()=>{
            if(installing.state==="installed"){
                if(navigator.serviceWorker.controller){ markUpdateReady(); }
                else{ void verifyOfflineReadiness(registration.active||installing); }
            }
        });
    });
}

async function registerOfflineApplication(){
    if(!isServiceWorkerSupported()){
        renderConnectivity();
        return null;
    }
    const existing=await navigator.serviceWorker.getRegistration("./");
    if(existing){
        observeRegistration(existing);
        const readyRegistration=await navigator.serviceWorker.ready;
        offlineRegistration=readyRegistration;
        await verifyOfflineReadiness(readyRegistration.active||navigator.serviceWorker.controller);
        if(isOffline()){ return existing; }
    }
    const workerUrl=new URL("service-worker.js",location.href);
    workerUrl.searchParams.set("v",OFFLINE_APP_REVISION);
    const registration=await navigator.serviceWorker.register(workerUrl.href,{
        scope:"./",
        updateViaCache:"none"
    });
    observeRegistration(registration);
    const readyRegistration=await navigator.serviceWorker.ready;
    offlineRegistration=readyRegistration;
    await verifyOfflineReadiness(readyRegistration.active||navigator.serviceWorker.controller);
    if(!isOffline()){
        try{ await registration.update(); }
        catch(error){
            console.warn("[Career Mode Showdown] Service worker update check could not complete:",error);
            void verifyNetworkConnectivity();
        }
    }
    markUpdateReady();
    return registration;
}

function consumeEarlyInstallPrompt(){
    if(window.__cmsDeferredInstallPrompt){
        deferredInstallPrompt=window.__cmsDeferredInstallPrompt;
        window.__cmsDeferredInstallPrompt=null;
        installPromptCaptured=true;
    }
}

function initializeOfflineApplication(){
    consumeEarlyInstallPrompt();
    installedStandalone=isStandaloneDisplay();
    renderConnectivity();

    window.addEventListener("offline",()=>setConnectivityState("offline",true));
    window.addEventListener("online",()=>{
        connectivityVerified=false;
        void verifyNetworkConnectivity();
    });
    window.addEventListener("beforeinstallprompt",event=>{
        event.preventDefault();
        deferredInstallPrompt=event;
        installPromptCaptured=true;
        dispatchOfflineState();
    });
    window.addEventListener("appinstalled",()=>{
        deferredInstallPrompt=null;
        installedStandalone=true;
        dispatchOfflineState();
        window.showAppNotice?.(
            "Career Mode Showdown is installed and ready for local offline use.",
            "success",
            5500
        );
    });

    if(!isServiceWorkerSupported()){
        setConnectivityState(navigator.onLine===false?"offline":"online",true);
        return;
    }

    navigator.serviceWorker.addEventListener("controllerchange",()=>{
        if(activationRequested&&!controllerReloaded){
            controllerReloaded=true;
            location.reload();
            return;
        }
        void verifyOfflineReadiness(navigator.serviceWorker.controller);
    });

    registerOfflineApplication().catch(error=>{
        offlineReady=false;
        offlineRecoveryReady=false;
        connectivityVerified=false;
        renderConnectivity();
        window.reportApplicationError?.("Offline application support could not be prepared",error);
    });
}

window.getOfflineAppDiagnostics=()=>({
    revision:OFFLINE_APP_REVISION,
    supported:isServiceWorkerSupported(),
    registration:Boolean(offlineRegistration),
    waiting:Boolean(offlineRegistration?.waiting),
    connectivity:verifiedConnectivity,
    connectivityVerified,
    standalone:isStandaloneDisplay(),
    installPromptCaptured,
    installGuidance:getInstallGuidance(),
    offlineReady:offlineReady&&connectivityVerified,
    offlineRecoveryReady,
    cacheStatus:lastCacheStatus,
    safeUpdateBoundary:getUpdateBoundaryStatus()
});
window.getOfflineAppSettingsState=getOfflineAppSettingsState;
window.requestOfflineAppInstall=requestOfflineAppInstall;
window.getOfflineUpdateBoundaryStatus=getUpdateBoundaryStatus;
window.activateWaitingOfflineUpdate=activateWaitingUpdate;
window.requestPreviousOfflineRuntime=requestPreviousRuntimeRollback;
initializeOfflineApplication();
