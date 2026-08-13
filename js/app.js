const APP_VERSION="1.1.5";
const APP_ASSET_REVISION=`${APP_VERSION}-r1`;
const STARTUP_SPLASH_MINIMUM_MS=2700;
const STARTUP_SPLASH_REDUCED_MS=220;
const STARTUP_SPLASH_EXIT_MS=240;
const VISUAL_FIDELITY_STYLESHEET="css/visual-fidelity-r3.css?v=1.1.5-r1";
const EXTERNAL_RUNTIME_ERROR=/contentScriptData\.init_ts|(?:chrome|moz|safari-web)-extension:\/\/|webkit-masked-url:\/\//i;
let applicationStarted=false,runtimeNoticeTimer=null,runtimeBoundaryInstalled=false,performanceLifecycleInstalled=false,runtimeNoticeElement=null,runtimeNoticeTextElement=null,suppressedExternalRuntimeErrors=0,offlineApplicationLoadPromise=null;

function versionedApplicationUrl(path){const url=new URL(path,location.href);url.searchParams.set("v",APP_ASSET_REVISION);return url.href;}
function captureDeferredInstallPrompt(event){event.preventDefault();window.__cmsDeferredInstallPrompt=event;}
addEventListener("beforeinstallprompt",captureDeferredInstallPrompt,{once:true});
function installOfflineMetadata(){
 let manifest=document.querySelector('link[rel="manifest"]');
 if(!manifest){manifest=document.createElement("link");manifest.rel="manifest";manifest.dataset.offlineManifest="true";document.head.appendChild(manifest);}
 manifest.href=versionedApplicationUrl("manifest.webmanifest");
 let theme=document.querySelector('meta[name="theme-color"]');
 if(!theme){theme=document.createElement("meta");theme.name="theme-color";document.head.appendChild(theme);}
 theme.content="#20272d";
}
installOfflineMetadata();

function installVisualFidelityStyles(){
 if(document.querySelector('link[data-visual-fidelity="reus-r3"]'))return;
 const s=document.createElement("link");s.rel="stylesheet";s.href=VISUAL_FIDELITY_STYLESHEET;s.dataset.visualFidelity="reus-r3";
 s.addEventListener("error",()=>console.warn("[Career Mode Showdown] Reus visual fidelity stylesheet could not be loaded. Base visuals remain available."),{once:true});document.head.appendChild(s);
}
installVisualFidelityStyles();

function getRuntimeNotice(){
 if(runtimeNoticeElement?.isConnected)return runtimeNoticeElement;
 const e=document.getElementById("appRuntimeNotice");
 if(e){runtimeNoticeElement=e;runtimeNoticeTextElement=e.querySelector(".runtimeNoticeText");return e;}
 const n=document.createElement("div"),t=document.createElement("span"),b=document.createElement("button");
 n.id="appRuntimeNotice";n.setAttribute("role","status");n.setAttribute("aria-live","polite");t.className="runtimeNoticeText";b.type="button";b.setAttribute("aria-label","Dismiss message");b.textContent="×";
 b.addEventListener("click",()=>{if(runtimeNoticeTimer)clearTimeout(runtimeNoticeTimer);runtimeNoticeTimer=null;n.remove();runtimeNoticeElement=runtimeNoticeTextElement=null;});
 n.append(t,b);document.body.appendChild(n);runtimeNoticeElement=n;runtimeNoticeTextElement=t;return n;
}
function showAppNotice(message,type="error",duration=7000){
 const n=getRuntimeNotice();if(n.className!==type)n.className=type;const m=String(message||"");if(runtimeNoticeTextElement&&runtimeNoticeTextElement.textContent!==m)runtimeNoticeTextElement.textContent=m;
 if(runtimeNoticeTimer)clearTimeout(runtimeNoticeTimer);runtimeNoticeTimer=duration>0?setTimeout(()=>{if(runtimeNoticeElement?.isConnected)runtimeNoticeElement.remove();runtimeNoticeElement=runtimeNoticeTextElement=runtimeNoticeTimer=null;},duration):null;
}
window.showAppNotice=showAppNotice;
function reportApplicationError(context,error){const d=error?.message||String(error||"Unknown error");console.error(`[Career Mode Showdown] ${context}:`,error);showAppNotice(`${context}. ${d}`,"error",10000);}
window.reportApplicationError=reportApplicationError;
function isFirstPartyRuntimeError(message="",filename="",stack=""){
 const evidence=`${message}\n${filename}\n${stack}`;if(EXTERNAL_RUNTIME_ERROR.test(evidence))return false;
 if(filename)try{if(new URL(filename,location.href).origin===location.origin)return true;}catch(error){}
 return String(stack||"").includes(`${location.origin}/`);
}
function suppressExternalRuntimeError(){suppressedExternalRuntimeErrors+=1;}
window.isFirstPartyRuntimeError=isFirstPartyRuntimeError;
window.getRuntimeErrorBoundaryDiagnostics=()=>({installed:runtimeBoundaryInstalled,suppressedExternalRuntimeErrors});
function installRuntimeErrorBoundary(){
 if(runtimeBoundaryInstalled)return;runtimeBoundaryInstalled=true;
 addEventListener("error",e=>{if(!e)return;const x=e.error,m=String(e.message||x?.message||""),s=typeof x?.stack==="string"?x.stack:"";if(!isFirstPartyRuntimeError(m,e.filename||"",s)){suppressExternalRuntimeError();return;}reportApplicationError("A runtime error was detected",x||new Error(m||"Unknown runtime error"));});
 addEventListener("unhandledrejection",e=>{const r=e?.reason,m=r?.message?String(r.message):String(r||"Unknown promise rejection"),s=typeof r?.stack==="string"?r.stack:"";if(!isFirstPartyRuntimeError(m,"",s)){suppressExternalRuntimeError();return;}reportApplicationError("An unexpected application error was detected",r);});
}

function resumeVisibleTransferTimer(){
 if(typeof currentShowdown==="undefined"||!currentShowdown||typeof window.getActiveScreenName!=="function"||window.getActiveScreenName()!=="transferChallenge"||typeof getTransferChallengeForSeason!=="function")return;
 const c=getTransferChallengeForSeason(currentShowdown.currentRound);if(!c||c.status!=="active")return;
 if(typeof window.synchronizeTransferDeadline==="function")window.synchronizeTransferDeadline(c);
 if(c.status==="active"&&typeof window.startTransferTimerLoop==="function")window.startTransferTimerLoop();else if(typeof window.renderTransferChallenge==="function")window.renderTransferChallenge(c);
}
function initializePerformanceLifecycle(){
 if(performanceLifecycleInstalled)return;performanceLifecycleInstalled=true;
 document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden"){if(typeof window.stopTransferTimerLoop==="function")window.stopTransferTimerLoop();return;}resumeVisibleTransferTimer();});
}
window.initializePerformanceLifecycle=initializePerformanceLifecycle;
function isStartupMotionReduced(){return typeof window.isReducedMotionPreferred==="function"?window.isReducedMotionPreferred():Boolean(typeof matchMedia==="function"&&matchMedia("(prefers-reduced-motion: reduce)").matches);}
function finishStartupPresentation(loadingScreen,app,reducedMotion){
 if(loadingScreen){loadingScreen.setAttribute("aria-hidden","true");loadingScreen.setAttribute("aria-busy","false");loadingScreen.classList.add("is-exiting");}
 if(app){app.inert=false;app.removeAttribute("aria-hidden");}
 const done=()=>{if(!loadingScreen)return;loadingScreen.hidden=true;loadingScreen.classList.add("hidden");};reducedMotion?done():setTimeout(done,STARTUP_SPLASH_EXIT_MS);
}
function revealApplication(){
 const loadingScreen=document.getElementById("loadingScreen"),app=document.getElementById("app");if(app){app.classList.remove("hidden");app.inert=true;}
 const reducedMotion=isStartupMotionReduced(),minimumDuration=reducedMotion?STARTUP_SPLASH_REDUCED_MS:STARTUP_SPLASH_MINIMUM_MS,elapsed=typeof performance!=="undefined"&&typeof performance.now==="function"?performance.now():minimumDuration;
 if(loadingScreen)loadingScreen.classList.add("is-ready");setTimeout(()=>finishStartupPresentation(loadingScreen,app,reducedMotion),Math.max(0,minimumDuration-elapsed));
}
function scheduleApplicationDiagnostics(){
 const run=async()=>{try{if(typeof window.ensureDiagnosticsModule==="function")await window.ensureDiagnosticsModule();if(typeof window.runApplicationDiagnostics==="function")window.runApplicationDiagnostics();}catch(error){console.warn("[Career Mode Showdown] Diagnostics could not be loaded:",error);}};
 typeof requestIdleCallback==="function"?requestIdleCallback(()=>run(),{timeout:2200}):setTimeout(run,350);
}
function loadOfflineApplicationSupport(){
 if(typeof window.getOfflineAppDiagnostics==="function")return Promise.resolve(true);if(offlineApplicationLoadPromise)return offlineApplicationLoadPromise;
 offlineApplicationLoadPromise=new Promise((resolve,reject)=>{
  const existing=document.querySelector('script[data-offline-application="true"]'),script=existing||document.createElement("script");let settled=false;
  const cleanup=()=>{script.removeEventListener("load",handleLoad);script.removeEventListener("error",handleError);};
  const handleLoad=()=>{if(settled)return;settled=true;cleanup();typeof window.getOfflineAppDiagnostics==="function"?resolve(true):reject(new Error("Offline application module loaded without exposing diagnostics."));};
  const handleError=()=>{if(settled)return;settled=true;cleanup();if(!existing)script.remove();reject(new Error("Unable to load offline application support."));};
  script.addEventListener("load",handleLoad,{once:true});script.addEventListener("error",handleError,{once:true});
  if(!existing){script.async=true;script.src=versionedApplicationUrl("js/offlineApp.js");script.dataset.offlineApplication="true";document.body.appendChild(script);}
 }).catch(error=>{offlineApplicationLoadPromise=null;reportApplicationError("Offline application support could not be loaded",error);return false;});
 return offlineApplicationLoadPromise;
}
function scheduleOfflineApplicationSupport(){const load=()=>void loadOfflineApplicationSupport();typeof requestIdleCallback==="function"?requestIdleCallback(load,{timeout:1200}):setTimeout(load,140);}
window.loadOfflineApplicationSupport=loadOfflineApplicationSupport;
function runInitializer(name,initializer){if(typeof initializer!=="function")throw new Error(`Required initializer is unavailable: ${name}`);initializer();}
function initializeApplicationModules(){[["initializeStorageLifecycle",window.initializeStorageLifecycle],["initializeScreens",window.initializeScreens||(typeof initializeScreens==="function"?initializeScreens:null)],["initializeMenuExperience",window.initializeMenuExperience||(typeof initializeMenuExperience==="function"?initializeMenuExperience:null)],["initializeOptionalModules",window.initializeOptionalModules],["initializePerformanceLifecycle",initializePerformanceLifecycle]].forEach(([name,initializer])=>runInitializer(name,initializer));}
function startApplication(){
 if(applicationStarted)return;applicationStarted=true;installRuntimeErrorBoundary();
 try{initializeApplicationModules();if(!showScreen("mainMenu",false))throw new Error("Main Menu could not be opened.");}catch(error){reportApplicationError("The application could not finish initializing",error);}
 requestAnimationFrame(()=>{revealApplication();scheduleOfflineApplicationSupport();scheduleApplicationDiagnostics();});
}
function bootstrapApplication(){startApplication();}
document.readyState==="loading"?document.addEventListener("DOMContentLoaded",bootstrapApplication,{once:true}):bootstrapApplication();
