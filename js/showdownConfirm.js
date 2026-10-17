(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else{root.CareerModeShowdownConfirm=api;root.askShowdownConfirm=api.ask;}
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // r78 (HO-029): ONE shared black-and-gold marble confirm box. It replaces every native window.confirm() in the app.
  // - ask(message,{tone}) resolves true only when the player presses OK. Cancel, Esc and anything else resolve false
  //   (no answer is never consent, as with the guarded native confirm()).
  // - The words are the call site's own: the first question becomes the heading and the rest the body; nothing is added.
  //   The two buttons keep the native labels (OK / Cancel).
  // - Keyboard: focus moves into the box and is trapped there (Tab / Shift+Tab cycle Cancel and OK), Esc = Cancel,
  //   Enter = OK (Enter on a focused Cancel button is Cancel), and focus returns to the control that opened it.
  // - Looks: Team V's .r78-modal (css/r78-marble-surfaces.css, section 5). The layer is transparent: it blocks clicks but
  //   never dims, greys or blurs the screen behind (HO-027). Static: no animation.
  // - One box at a time; a second ask waits for the first to be answered.
  const LAYER_ID="showdownConfirm";
  const STYLES=Object.freeze([["r78-type","css/r78-type.css"],["r78-marble-surfaces","css/r78-marble-surfaces.css"]]);
  const STYLE_WAIT_MS=1500;
  const LABELS=Object.freeze({confirm:"OK",cancel:"Cancel"});
  let queue=Promise.resolve();
  let open=null;

  function scSplitMessage(message){
    const text=String(message==null?"":message).trim();
    const end=text.search(/\?(?:\s|$)/);
    if(end<0)return {title:text,body:""};
    return {title:text.slice(0,end+1),body:text.slice(end+1).trim()};
  }

  // The marble sheets load with Team V's shell after the loading screen (js/v10Screens.js). If a box is asked for before
  // that (or with no Team V shell), load them first, for a short time at most; the box is opaque even without them.
  function scEnsureStyles(doc){
    try{
      const loaded=root.getComputedStyle&&root.getComputedStyle(doc.documentElement).getPropertyValue("--r78-panel").trim();
      if(loaded||doc.querySelector('link[data-v10-style="css/r78-marble-surfaces.css"]')||typeof root.loadRuntimeStyle!=="function")return Promise.resolve();
      const all=Promise.all(STYLES.map(([key,file])=>root.loadRuntimeStyle(key,file))).catch(()=>{});
      return Promise.race([all,new Promise(resolve=>root.setTimeout(resolve,STYLE_WAIT_MS))]);
    }catch(error){return Promise.resolve();}
  }

  function scCreate(doc,tag,className,text){
    const node=doc.createElement(tag);
    if(className)node.className=className;
    if(text!==undefined)node.textContent=text;
    return node;
  }

  function scShow(message,options){
    const doc=root.document;
    if(!doc||!doc.body)return Promise.resolve(false);
    const tone=options&&options.tone==="primary"?"primary":"danger";
    const {title,body}=scSplitMessage(message);
    const trigger=doc.activeElement&&doc.activeElement!==doc.body?doc.activeElement:null;

    const layer=scCreate(doc,"div","r78-modal");
    layer.id=LAYER_ID;
    layer.setAttribute("role","alertdialog");
    layer.setAttribute("aria-modal","true");
    layer.setAttribute("aria-labelledby",LAYER_ID+"Title");
    layer.setAttribute("aria-describedby",body?LAYER_ID+"Body":LAYER_ID+"Title");
    // Tiny inline fallback (same values as the sheet): a full-screen transparent click shield with the box on top.
    Object.assign(layer.style,{position:"fixed",inset:"0",zIndex:"120",display:"grid",placeItems:"center",padding:"16px",background:"transparent"});
    const panel=scCreate(doc,"section","r78-panel r78-panel--float r78-modal__panel");
    panel.tabIndex=-1;
    Object.assign(panel.style,{backgroundColor:"#110f0c",color:"#f2ebdd",outline:"none"});
    const heading=scCreate(doc,"h2","r78-modal__title",title);
    heading.id=LAYER_ID+"Title";
    panel.append(heading);
    if(body){const copy=scCreate(doc,"p","r78-modal__body",body);copy.id=LAYER_ID+"Body";panel.append(copy);}
    const actions=scCreate(doc,"div","r78-modal__actions");
    const cancel=scCreate(doc,"button","r78-btn r78-btn--secondary",LABELS.cancel);
    cancel.type="button";cancel.setAttribute("data-r78-cancel","");
    const confirm=scCreate(doc,"button",`r78-btn r78-btn--${tone}`,LABELS.confirm);
    confirm.type="button";confirm.setAttribute("data-r78-confirm","");
    actions.append(cancel,confirm);
    panel.append(actions);
    layer.append(panel);

    return new Promise(resolve=>{
      const focusables=[cancel,confirm];
      let done=false;
      const scFinish=answer=>{
        if(done)return;
        done=true;open=null;
        doc.removeEventListener("keydown",scOnKey,true);
        doc.removeEventListener("focusin",scOnFocusIn,true);
        layer.remove();
        if(trigger&&trigger.isConnected&&typeof trigger.focus==="function"){try{trigger.focus({preventScroll:true});}catch(error){}}
        resolve(answer===true);
      };
      const stop=event=>{event.preventDefault();event.stopPropagation();if(typeof event.stopImmediatePropagation==="function")event.stopImmediatePropagation();};
      function scOnKey(event){
        if(event.key==="Escape"||event.key==="Esc"){stop(event);scFinish(false);return;}
        if(event.key==="Enter"){stop(event);scFinish(doc.activeElement!==cancel);return;}
        if(event.key==="Tab"){
          stop(event);
          const index=focusables.indexOf(doc.activeElement);
          const next=event.shiftKey?(index<=0?focusables.length-1:index-1):(index<0||index>=focusables.length-1?0:index+1);
          focusables[next].focus();
        }
      }
      function scOnFocusIn(event){if(!layer.contains(event.target))cancel.focus();}
      cancel.addEventListener("click",()=>scFinish(false));
      confirm.addEventListener("click",()=>scFinish(true));
      doc.addEventListener("keydown",scOnKey,true);
      doc.addEventListener("focusin",scOnFocusIn,true);
      doc.body.append(layer);
      open={layer,finish:scFinish};
      try{panel.focus({preventScroll:true});}catch(error){panel.focus();}
    });
  }

  // A framed app could have its OK button lined up under a hostile page's
  // clicks (GitHub Pages cannot send frame-ancestors), so framed = Cancel.
  function scIsFramed(){
    try{return root.top!==root.self;}catch(error){return true;}
  }

  function scAsk(message,options){
    const run=()=>{
      if(scIsFramed())return Promise.resolve(false);
      const doc=root.document;
      return (doc?scEnsureStyles(doc):Promise.resolve()).then(()=>scShow(message,options));
    };
    const answer=queue.then(run,run);
    queue=answer.catch(()=>false);
    return answer.catch(()=>false);
  }

  function scIsOpen(){return open!==null;}

  return Object.freeze({contractVersion:1,feature:"r78-marble-confirm",nativeConfirmReplaced:true,LAYER_ID,LABELS,ask:scAsk,isOpen:scIsOpen,isFramed:scIsFramed,framedAnswer:false,splitMessage:scSplitMessage});
});
