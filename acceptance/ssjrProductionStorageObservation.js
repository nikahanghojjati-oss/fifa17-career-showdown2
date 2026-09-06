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
  const CARD_ID="ssjrCanonicalStorageObservation";
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

  function element(documentImpl,tag,className,text){
    const node=documentImpl.createElement(tag);
    if(className)node.className=className;
    if(text!==undefined)node.textContent=String(text);
    return node;
  }

  function ensureSurface(documentImpl){
    let card=documentImpl.getElementById(CARD_ID);
    if(card){
      return {
        capture:documentImpl.getElementById(CAPTURE_BUTTON_ID),
        clear:documentImpl.getElementById(CLEAR_BUTTON_ID),
        status:documentImpl.getElementById(STATUS_ID),
        output:documentImpl.getElementById(OUTPUT_ID)
      };
    }
    const shell=documentImpl.querySelector("main.acceptanceShell");
    if(!shell)return null;
    card=element(documentImpl,"section","acceptanceCard acceptanceStage5f");
    card.id=CARD_ID;
    card.append(
      element(documentImpl,"span","acceptanceKicker","SSJR · READ-ONLY CANONICAL STORAGE"),
      element(documentImpl,"h2","","Exact local-save observation"),
      element(documentImpl,"p","","This bounded production surface reads exactly the three canonical local gameplay storage values. It does not parse, normalize, hash, download, persist or change them. Reveal only when you are ready to pass the raw snapshot directly to the repository recorder through stdin."));
    const actions=element(documentImpl,"div");
    const capture=element(documentImpl,"button","acceptanceButton","REVEAL EXACT CANONICAL SNAPSHOT");
    capture.id=CAPTURE_BUTTON_ID;capture.type="button";
    const clear=element(documentImpl,"button","acceptanceButton","CLEAR SNAPSHOT FROM PAGE");
    clear.id=CLEAR_BUTTON_ID;clear.type="button";clear.disabled=true;
    actions.append(capture,clear);
    const status=element(documentImpl,"p","acceptanceStatus","No raw canonical snapshot is currently exposed on this page.");
    status.id=STATUS_ID;status.setAttribute("role","status");status.setAttribute("aria-live","polite");
    const output=element(documentImpl,"pre","acceptanceEvidence","");
    output.id=OUTPUT_ID;output.hidden=true;output.dataset.privateTransient="true";
    const warning=element(documentImpl,"p","acceptanceMeta","The revealed JSON contains raw local save bytes. Do not save or share it as evidence. The repository recorder must hash the exact snapshot immediately and retain only its privacy-safe digest.");
    card.append(actions,status,output,warning);
    const existingEvidence=documentImpl.getElementById("authorizationAcceptanceEvidence");
    const evidenceCard=existingEvidence&&typeof existingEvidence.closest==="function"?existingEvidence.closest("section"):null;
    shell.insertBefore(card,evidenceCard||null);
    return {capture,clear,status,output};
  }

  function install(documentImpl=root.document){
    if(!documentImpl)return false;
    const surface=ensureSurface(documentImpl);
    if(!surface||!surface.capture||!surface.clear||!surface.status||!surface.output)return false;
    const {capture,clear,status,output}=surface;
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
