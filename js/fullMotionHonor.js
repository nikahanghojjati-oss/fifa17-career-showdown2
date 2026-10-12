(function(root){
  "use strict";
  // Settings > FULL MOTION promises "Always use standard transitions and reveal animations", but a device that
  // reports prefers-reduced-motion: reduce still reaches two places that js/storage.js cannot see:
  //  1. unconditional @media (prefers-reduced-motion: reduce) rules in the stylesheets (app, screens and the
  //     frozen Team V visual-assets), and
  //  2. direct matchMedia("(prefers-reduced-motion: reduce)") reads in screen scripts (frozen ones included).
  // While the stored choice is "full" this module makes both behave as if the device had not asked for reduced
  // motion. FOLLOW DEVICE and REDUCE MOTION are left exactly as they were: nothing here runs for them.
  // It is a non-startup module (js/ssjr.js loads it before any screen module); it never edits a stylesheet file.
  const REDUCE_QUERY=/^\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)$/i;
  const REDUCE_IN_RULE=/prefers-reduced-motion\s*:\s*reduce/i;
  const NEVER_MATCHES="not all";
  const MARK="__careerModeFullMotionHonor";
  const originalMedia=new WeakMap();
  let observer=null;
  let loadListening=false;
  let installed=false;

  function isFullMotionChosen(){
    try{
      if(typeof root.loadApplicationPreferences==="function"){
        const preferences=root.loadApplicationPreferences();
        return Boolean(preferences&&preferences.motionPreference==="full");
      }
      return root.document?.documentElement?.dataset?.motionPreference==="full";
    }catch(error){return false;}
  }

  // matchMedia: only the exact reduce query is touched, and only while the choice is "full".
  function installMatchMedia(){
    const native=root.matchMedia;
    if(typeof native!=="function"||native[MARK])return;
    const wrapped=function matchMedia(query){
      const list=native.apply(root,arguments);
      if(!list||!REDUCE_QUERY.test(String(query).trim())||typeof Proxy!=="function")return list;
      return new Proxy(list,{
        get(target,key){
          if(key==="matches")return isFullMotionChosen()?false:target.matches;
          const value=Reflect.get(target,key,target);
          return typeof value==="function"?value.bind(target):value;
        },
        set(target,key,value){target[key]=value;return true;}
      });
    };
    wrapped[MARK]=true;
    root.matchMedia=wrapped;
  }

  // CSS: while "full", every media rule that asks for reduced motion is switched off (and put back afterwards).
  function walkRules(rules,full){
    for(const rule of Array.from(rules||[])){
      if(rule.styleSheet)walkSheet(rule.styleSheet,full);
      if(rule.media&&typeof rule.media.mediaText==="string"){
        if(full){
          if(!originalMedia.has(rule)&&REDUCE_IN_RULE.test(rule.media.mediaText)){
            originalMedia.set(rule,rule.media.mediaText);
            rule.media.mediaText=NEVER_MATCHES;
          }
        }else if(originalMedia.has(rule)){
          rule.media.mediaText=originalMedia.get(rule);
          originalMedia.delete(rule);
        }
      }
      if(rule.cssRules)walkRules(rule.cssRules,full);
    }
  }
  function walkSheet(sheet,full){
    try{walkRules(sheet.cssRules,full);}catch(error){/* cross-origin sheet (fonts): nothing to adjust */}
  }
  function syncStyleSheets(full){
    const sheets=root.document?.styleSheets;
    if(!sheets)return;
    for(const sheet of Array.from(sheets))walkSheet(sheet,full);
  }

  function isStyleNode(node){return node&&(node.nodeName==="LINK"||node.nodeName==="STYLE");}
  function onMutations(mutations){
    for(const mutation of mutations)for(const node of Array.from(mutation.addedNodes||[]))if(isStyleNode(node)){syncStyleSheets(true);return;}
  }
  function onStyleSheetLoad(event){if(event&&event.target&&event.target.nodeName==="LINK")syncStyleSheets(true);}

  // Stylesheets are added lazily (screen CSS, Team V CSS, injected <style>), so keep watching while "full".
  function watchLateStyleSheets(watch){
    const document=root.document;
    if(!document)return;
    if(watch){
      if(!observer&&typeof root.MutationObserver==="function"&&document.documentElement){
        observer=new root.MutationObserver(onMutations);
        observer.observe(document.documentElement,{childList:true,subtree:true});
      }
      if(!loadListening&&typeof document.addEventListener==="function"){
        document.addEventListener("load",onStyleSheetLoad,true);
        loadListening=true;
      }
    }else{
      if(observer){observer.disconnect();observer=null;}
      if(loadListening&&typeof document.removeEventListener==="function"){
        document.removeEventListener("load",onStyleSheetLoad,true);
        loadListening=false;
      }
    }
  }

  function syncFullMotionStyles(){
    const full=isFullMotionChosen();
    syncStyleSheets(full);
    watchLateStyleSheets(full);
    return full;
  }

  function installFullMotionHonor(){
    if(installed)return api;
    installed=true;
    installMatchMedia();
    if(typeof root.addEventListener==="function")root.addEventListener("career-mode-preferences-change",syncFullMotionStyles);
    syncFullMotionStyles();
    return api;
  }

  const api={install:installFullMotionHonor,sync:syncFullMotionStyles,isFullMotionChosen};
  root.CareerModeFullMotionHonor=api;
})(typeof window!=="undefined"?window:globalThis);
