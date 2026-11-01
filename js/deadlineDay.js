(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeDeadlineDay=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // r87 Deadline Day (Nik's ask): during the last 60 seconds of a live Transfer Challenge window a DEADLINE DAY strip runs
  // rolling headlines, and from 10 seconds left it shows one commentator line (data/deadlineDayLines.js; the r86 commentary
  // engine has no transfer-window situation). It follows the window clock production already draws in #transferTimerDisplay
  // from the shared deadline (js/productionSharedTransferChallenge.js): no Firebase read or write, no timer of its own, and it
  // never decides, scores or ends anything. Both phones show the same words (picked by season and by the clock).
  // Layout (Team V's Transfer War, js/transferScreenV10.js): the strip always takes its own room, never a layer over the screen.
  //   phone / tablet column layouts: a row of the screen's own column, right under the status band with the clock;
  //   fixed desktop stage: a band under the top bar, and the stage starts below it (Team V's camera re-fits to the smaller stage);
  //   scrolling layouts: a block right before the stage.
  // Look: black marble with a gold edge and a polished gold DEADLINE DAY badge. No dimming, no scrim, no blur.
  const TICKER_FROM_S=60,LINE_FROM_S=10,HEADLINE_S=5,STRIP_ID="deadlineDayStrip";
  const FALLBACK=Object.freeze({ticker:Object.freeze([Object.freeze({id:"dd-fallback",text:"The transfer window is closing"})]),countdown:Object.freeze([])});
  const ddFreeze=value=>{if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(ddFreeze);Object.freeze(value);}return value;};

  // ---- pure (tests/contracts/r87-deadline-day-contracts.cjs runs these) ----
  // The window clock as production draws it ("MM:SS"), in whole seconds; null for anything else (SYNC, REPLAY, blank).
  function ddSeconds(text){const m=/^(\d{1,2}):([0-5]\d)$/.exec(String(text==null?"":text).trim());return m?Number(m[1])*60+Number(m[2]):null;}
  // off · ticker (60..11 s left) · countdown (10..1 s left). Only a live window counts (never a replay or a closed window).
  function ddMode(windowLive,seconds){
    if(windowLive!==true||!Number.isInteger(seconds)||seconds<1||seconds>TICKER_FROM_S)return "off";
    return seconds<=LINE_FROM_S?"countdown":"ticker";
  }
  const ddFill=(text,season)=>String(text).split("{season}").join(String(season));
  function ddView(input={}){
    const seconds=ddSeconds(input.clock),mode=ddMode(input.windowLive,seconds);
    if(mode==="off")return ddFreeze({mode,seconds});
    const season=Number.isInteger(input.season)&&input.season>0?input.season:1,lines=input.lines&&Array.isArray(input.lines.ticker)&&input.lines.ticker.length?input.lines:FALLBACK;
    if(mode==="countdown"){
      const list=Array.isArray(lines.countdown)?lines.countdown:[];
      if(list.length){const row=list[(season-1)%list.length];return ddFreeze({mode,seconds,id:row.id,text:ddFill(row.text,season)});}
    }
    // One headline at a time, the next every 5 seconds of the clock: the same headline on both phones at the same second.
    const list=lines.ticker,step=Math.floor((TICKER_FROM_S-Math.min(seconds,TICKER_FROM_S))/HEADLINE_S),row=list[(season-1+step)%list.length];
    return ddFreeze({mode:"ticker",seconds,id:row.id,text:ddFill(row.text,season)});
  }

  // ---- browser binding (lazy; driven by js/transferScreenV10.js on every clock change) ----
  let strip=null,lines=null,linesLoad=null,shown="";
  function ddLines(){
    if(lines)return lines;
    if(root.CareerModeDeadlineDayLines){lines=root.CareerModeDeadlineDayLines;return lines;}
    if(!linesLoad&&typeof root.loadRuntimeScript==="function"){
      // A static file of words, fetched once while the window is live (offline shell: service-worker.js). No Firebase.
      linesLoad=Promise.resolve(root.loadRuntimeScript("deadline-day-lines","data/deadlineDayLines.js",()=>Boolean(root.CareerModeDeadlineDayLines)))
        .then(()=>{lines=root.CareerModeDeadlineDayLines||null;}).catch(()=>{}).then(()=>{linesLoad=null;});
    }
    return null;
  }
  function ddStrip(doc){
    if(strip&&strip.ownerDocument===doc)return strip;
    strip=doc.createElement("div");strip.id=STRIP_ID;strip.className="ddStrip";strip.hidden=true;
    strip.setAttribute("role","region");strip.setAttribute("aria-label","Deadline Day");
    const badge=doc.createElement("span");badge.className="ddBadge";
    for(const word of ["DEADLINE","DAY"]){const b=doc.createElement("b");b.textContent=word;badge.appendChild(b);}
    const track=doc.createElement("span");track.className="ddTrack";
    strip.append(badge,track);
    return strip;
  }
  // Where the strip goes for the layout Team V's CSS gives this window size (see the header).
  function ddPlace(stage,node){
    const host=stage.parentElement,world=stage.querySelector(":scope > .world"),scene=world&&world.querySelector(":scope > .scene"),style=el=>root.getComputedStyle(el);
    let place="flow";
    if(world&&scene&&/flex/.test(style(world).display)&&/^column/.test(style(world).flexDirection))place="world";
    else if(style(stage).position==="fixed")place="fixed";
    if(place==="world"){if(node.parentNode!==world||node.previousElementSibling!==scene)scene.after(node);const gap=`${Math.max(0,parseFloat(style(world).rowGap)||0)}px`;if(host.style.getPropertyValue("--tw-dd-gap")!==gap)host.style.setProperty("--tw-dd-gap",gap);}
    else if(node.parentNode!==host||node.nextElementSibling!==stage)host.insertBefore(node,stage);
    for(const name of ["world","fixed","flow"])host.classList.toggle(`tw-dd-${name}`,name===place);
    return place;
  }
  function ddRender(node,view){
    const key=`${view.mode}|${view.id}`;if(key===shown)return;shown=key;
    const doc=node.ownerDocument,track=node.querySelector(".ddTrack");
    node.dataset.mode=view.mode;
    const label=doc.createElement("span");label.className="ddLabel";label.textContent=view.mode==="countdown"?"COMMENTARY":"BREAKING";
    const text=doc.createElement("span");text.className=view.mode==="countdown"?"ddLine":"ddHeadline";text.textContent=view.mode==="countdown"?`“${view.text}”`:view.text;
    // Headlines roll quietly; the one commentator line is announced once.
    track.setAttribute("aria-live",view.mode==="countdown"?"polite":"off");
    track.replaceChildren(label,text);
  }
  function ddDetach(){
    if(strip){const host=strip.closest?.(".tw-host")||strip.parentElement?.closest?.(".tw-host");if(host){host.classList.remove("tw-dd-world","tw-dd-fixed","tw-dd-flow","tw-dd-on");delete host.dataset.dd;host.style.removeProperty("--tw-dd-gap");}strip.remove();strip.hidden=true;}
    shown="";
  }
  function ddSync(stage,frame,clockText){
    if(!stage||!root.document||typeof root.getComputedStyle!=="function")return "off";
    const live=Boolean(frame&&frame.windowLive===true);
    if(live)ddLines();
    const view=ddView({windowLive:live,clock:clockText,season:frame&&frame.season,lines});
    if(view.mode==="off"){ddDetach();return "off";}
    const node=ddStrip(stage.ownerDocument||root.document);
    ddPlace(stage,node);stage.parentElement.classList.add("tw-dd-on");
    // r87 polish: the window clock joins the moment (css/v10Transfer.css: hot in the ticker, a pulse in the countdown).
    if(stage.parentElement.dataset.dd!==view.mode)stage.parentElement.dataset.dd=view.mode;
    ddRender(node,view);node.hidden=false;
    return view.mode;
  }
  return Object.freeze({contractVersion:1,STRIP_ID,TICKER_FROM_S,LINE_FROM_S,HEADLINE_S,seconds:ddSeconds,mode:ddMode,view:ddView,sync:ddSync,detach:ddDetach});
});
