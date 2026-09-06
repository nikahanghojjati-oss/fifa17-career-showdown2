(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSSJRProductionStorageObservation=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const CANONICAL_STORAGE_KEYS=Object.freeze([
    "careerModeShowdown.saveLibrary",
    "careerModeShowdown.legacyShowdowns",
    "careerModeShowdown.preferences"
  ]);
  const CAPTURE_BUTTON_ID="ssjrCaptureCanonicalStorage";
  const CLEAR_BUTTON_ID="ssjrClearCanonicalStorage";
  const STATUS_ID="ssjrCanonicalStorageStatus";
  const OUTPUT_ID="ssjrCanonicalStorageOutput";

  function captureExactCanonicalStorageSnapshot(storage=root.localStorage){
    if(!storage||typeof storage.getItem!=="function"){
      throw new Error("Exact canonical local-storage observation is unavailable in this browser context.");
    }
    const snapshot={};
    for(const key of CANONICAL_STORAGE_KEYS){
      snapshot[key]=storage.getItem(key);
    }
    return Object.freeze(snapshot);
  }

  function install(documentImpl=root.document){
    if(!documentImpl)return false;
    const capture=documentImpl.getElementById(CAPTURE_BUTTON_ID);
    const clear=documentImpl.getElementById(CLEAR_BUTTON_ID);
    const status=documentImpl.getElementById(STATUS_ID);
    const output=documentImpl.getElementById(OUTPUT_ID);
    if(!capture||!clear||!status||!output)return false;
    if(capture.dataset.ssjrStorageObserverInstalled==="true")return true;
    capture.dataset.ssjrStorageObserverInstalled="true";

    const clearSnapshot=()=>{
      output.textContent="";
      output.hidden=true;
      clear.disabled=true;
      status.textContent="No raw canonical snapshot is currently exposed on this page.";
    };

    capture.addEventListener("click",()=>{
      try{
        const snapshot=captureExactCanonicalStorageSnapshot();
        output.textContent=JSON.stringify(snapshot);
        output.hidden=false;
        clear.disabled=false;
        status.textContent="Exact raw canonical snapshot is visible only in this page DOM. Pass it immediately to the repository recorder through stdin, then clear it.";
      }catch(error){
        clearSnapshot();
        status.textContent=error&&error.message?error.message:"Exact canonical local-storage observation failed.";
      }
    });
    clear.addEventListener("click",clearSnapshot);
    clearSnapshot();
    return true;
  }

  const api=Object.freeze({
    schemaVersion:1,
    feature:"ssjr-production-canonical-storage-observation",
    readOnly:true,
    persistentCapture:false,
    privateIdentifierCapture:false,
    canonicalStorageKeys:CANONICAL_STORAGE_KEYS,
    captureExactCanonicalStorageSnapshot,
    install
  });

  if(root.document){
    if(root.document.readyState==="loading")root.document.addEventListener("DOMContentLoaded",()=>install(),{once:true});
    else install();
  }
  return api;
});
