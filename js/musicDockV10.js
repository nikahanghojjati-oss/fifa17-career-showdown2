// r85 (Nik 2026-10-27): the soundtrack player outside Home's own strip.
// - Desktop: a compact dock in the top bar, after the tabs, on every screen (Home too: its strip is hidden on desktop).
// - Phone and tablet (900px and under): a sixth MUSIC tab in the tab bar, and Home's TRACKS button, open the player sheet.
// - Both open one player panel: now playing, progress, previous / play / next / mute, and a one-column tracklist with
//   every title and artist written in full, scrolling inside itself. It is opaque and never dims the screen behind it.
// It drives Home's one <audio> through window.HomeSoundtrack, so a song keeps playing across screens. Nothing here touches
// Firestore; Audius is only asked for a song after a Play tap. Looks: css/v10Shell.css (.cmsMusicDock, .cmsMusicSheet, .cmsMusicTab).
(function(root){
  "use strict";
  if(!root||root.CareerModeMusicDockV10)return;
  const PHONE_MAX=900;
  let dock=null,sheet=null,watching=null,started=false;
  const player=()=>root.HomeSoundtrack;
  const setText=(el,v)=>{if(el&&el.textContent!==String(v))el.textContent=String(v);};
  const isAudio=event=>Boolean(event.target&&event.target.classList&&event.target.classList.contains("menuAudiusAudio"));
  const mdAudio=()=>root.document.querySelector("audio.menuAudiusAudio");
  const mdClock=sec=>{if(!Number.isFinite(sec)||sec<0)return"-:--";const m=Math.floor(sec/60),s=Math.floor(sec%60);return`${m}:${String(s).padStart(2,"0")}`;};
  const ICON={
    prev:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h2v14H6zM20 5v14L9.5 12z"/></svg>',
    next:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 5h2v14h-2zM4 5v14l10.5-7z"/></svg>',
    play:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15L19.5 12z"/></svg>',
    pause:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 4.5h4v15h-4zM13.5 4.5h4v15h-4z"/></svg>',
    sound:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    muted:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 9.5l5 5M21.5 9.5l-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    list:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h11v2H4zM4 11h11v2H4zM4 16h7v2H4zM17 6h3v8.2a3 3 0 1 1-2-2.8V8h-1z"/></svg>',
    close:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    disc:'<svg class="cmsMusicTabDisc" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6.5" fill="none" stroke="#0a0b0e" stroke-opacity=".55" stroke-width=".8"/><circle cx="12" cy="12" r="3.4" fill="#0a0b0e"/><circle cx="12" cy="12" r="1.2"/></svg>'
  };
  const swapIcon=(btn,key)=>{if(btn.dataset.icon!==key){btn.dataset.icon=key;btn.innerHTML=ICON[key];}};

  // A tapped song starts playing (the tap is the play gesture the browser asks for).
  function mdPick(key){
    const api=player();
    api.choose(key);
    if(!api.state().wantPlaying)api.toggle();
  }
  function mdStep(dir){
    const api=player(),all=api.tracks(),i=all.findIndex(t=>t.key===api.current().key);
    mdPick(all[(i+dir+all.length)%all.length].key);
  }

  function mdRender(){
    const api=player(),t=api&&api.current&&api.current();
    if(!t)return;
    const s=api.state(),failed=Boolean(s.failed),playing=Boolean(s.playing&&s.wantPlaying);
    const artist=failed?"STREAM UNAVAILABLE · TRY AGAIN":t.artist;
    if(dock){
      setText(dock.title,t.title);setText(dock.artist,artist);
      swapIcon(dock.toggle,s.wantPlaying?"pause":"play");
      dock.toggle.setAttribute("aria-label",(s.wantPlaying?"Pause ":"Play ")+t.title);dock.toggle.setAttribute("aria-pressed",String(Boolean(s.wantPlaying)));
      // Mute waits for the first Play, as on Home (there is no sound to mute before it).
      dock.mute.disabled=!s.src;swapIcon(dock.mute,s.muted?"muted":"sound");
      dock.mute.setAttribute("aria-label",s.muted?"Unmute":"Mute");dock.mute.setAttribute("aria-pressed",String(Boolean(s.muted)));
      dock.open.setAttribute("aria-expanded",String(Boolean(sheet&&!sheet.root.hidden)));
      dock.root.dataset.playing=String(playing);dock.root.dataset.failed=String(failed);
    }
    if(sheet){
      // r87: the kicker says what the player is doing, so a Play tap never looks dead while Audius connects.
      const a=mdAudio(),begun=Boolean(a&&s.src&&a.currentTime>0),sounding=playing&&Boolean(a)&&a.readyState>=3;
      setText(sheet.kicker,failed?"STREAM UNAVAILABLE":s.wantPlaying&&!sounding?"CONNECTING":sounding?(s.muted?"NOW PLAYING · MUTED":"NOW PLAYING"):begun?"PAUSED":"READY TO PLAY");
      setText(sheet.title,t.title);setText(sheet.artist,failed?"Tap Play to try again, or pick another song":t.artist);
      swapIcon(sheet.play,s.wantPlaying?"pause":"play");
      sheet.play.setAttribute("aria-label",(s.wantPlaying?"Pause ":"Play ")+t.title);
      sheet.mute.disabled=!s.src;swapIcon(sheet.mute,s.muted?"muted":"sound");
      sheet.mute.setAttribute("aria-label",s.muted?"Unmute":"Mute");sheet.mute.setAttribute("aria-pressed",String(Boolean(s.muted)));
      sheet.root.dataset.playing=String(playing);sheet.root.dataset.failed=String(failed);
      // The current song: aria-current plus a visible "now playing" icon (css), never colour alone. It is also the row
      // that Tab enters the list on (roving tabindex), unless the listener has already moved within the list.
      const inList=sheet.list.contains(root.document.activeElement);
      sheet.songs.forEach(b=>{
        const on=b.dataset.soundtrackTrack===t.key;b.classList.toggle("selected",on);
        if(on)b.setAttribute("aria-current","true");else b.removeAttribute("aria-current");
        if(!inList)b.tabIndex=on?0:-1;
      });
      mdTime();
    }
    const tab=root.document.getElementById("cmsMusicTab");
    if(tab){tab.dataset.playing=String(playing);tab.setAttribute("aria-expanded",String(Boolean(sheet&&!sheet.root.hidden&&sheet.root.dataset.mode==="phone")));}
    mdSession(t,s,playing);
    // A longer title or artist widens the dock, so the fit beside the account chips is worked out again (Codex, PR #1010).
    mdFitTop();
  }

  // r87: the phone lock screen and the Chromebook media controls name the song and drive this player (no artwork request).
  let sessionKey=null;
  function mdSession(t,s,playing){
    const ms=root.navigator&&root.navigator.mediaSession;
    if(!ms||!s.src)return;
    try{
      if(sessionKey!==t.key&&typeof root.MediaMetadata==="function"){sessionKey=t.key;ms.metadata=new root.MediaMetadata({title:t.title,artist:t.artist,album:"Career Mode Showdown"});}
      ms.playbackState=playing||s.wantPlaying?"playing":"paused";
    }catch(_){}
  }
  function mdSessionActions(){
    const ms=root.navigator&&root.navigator.mediaSession;
    if(!ms||typeof ms.setActionHandler!=="function")return;
    const set=(action,fn)=>{try{ms.setActionHandler(action,fn);}catch(_){}};
    set("play",()=>{if(!player().state().wantPlaying)player().toggle();});
    set("pause",()=>{if(player().state().wantPlaying)player().toggle();});
    set("previoustrack",()=>mdStep(-1));
    set("nexttrack",()=>mdStep(1));
  }

  function mdTime(){
    if(!sheet||sheet.root.hidden)return;
    const a=mdAudio(),cur=a?a.currentTime:0,dur=a?a.duration:NaN;
    // r87: the clock shows once the song has a length (no "0:00 … -:--" before the first Play); the bar stays.
    sheet.root.dataset.timed=String(Number.isFinite(dur)&&dur>0);
    sheet.bar.style.transform=`scaleX(${Number.isFinite(dur)&&dur>0?Math.min(1,cur/dur):0})`;
    setText(sheet.times[0],mdClock(cur||0));setText(sheet.times[1],mdClock(dur));
  }

  // ---- the player panel (phone sheet, desktop drop-down) ----
  function mdSheetBuild(){
    const doc=root.document,tracks=player().tracks(),el=doc.createElement("div");
    el.id="cmsMusicSheet";el.className="cmsMusicSheet";el.setAttribute("role","dialog");el.setAttribute("aria-label","Soundtrack player");el.hidden=true;
    el.innerHTML='<div class="cmsMusicSheetNow"><span class="cmsMusicSheetDisc" aria-hidden="true"><i></i></span>'+
      '<div class="cmsMusicSheetText"><span>NOW PLAYING</span><strong></strong><small></small></div>'+
      `<button class="cmsMusicSheetClose" type="button" aria-label="Close soundtrack player">${ICON.close}</button></div>`+
      '<div class="cmsMusicSheetTime"><span class="cmsMusicSheetBar" aria-hidden="true"><i></i></span><small>0:00</small><small>-:--</small></div>'+
      '<div class="cmsMusicSheetControls">'+
      '<button class="cmsMusicSheetMute" type="button" aria-label="Mute" disabled></button>'+
      `<button class="cmsMusicSheetPrev" type="button" aria-label="Previous song">${ICON.prev}</button>`+
      '<button class="cmsMusicSheetPlay" type="button" aria-label="Play"></button>'+
      `<button class="cmsMusicSheetNext" type="button" aria-label="Next song">${ICON.next}</button>`+
      '<span class="cmsMusicSheetEq" aria-hidden="true"><i></i><i></i><i></i><i></i></span></div>'+
      `<div class="cmsMusicSheetHead" aria-hidden="true"><strong>TRACKLIST</strong><small>${tracks.length} SONGS</small></div>`+
      `<ul class="cmsMusicSheetList" role="list" aria-label="Tracklist, ${tracks.length} songs. Choose a song to play it"></ul>`;
    const list=el.querySelector(".cmsMusicSheetList");
    tracks.forEach((t,i)=>{
      const li=doc.createElement("li"),b=doc.createElement("button");
      b.type="button";b.className="cmsMusicSheetSong";b.dataset.soundtrackTrack=t.key;b.tabIndex=-1;
      b.innerHTML='<em aria-hidden="true"></em><span><strong></strong><small></small></span><i class="cmsMusicSheetSongEq" aria-hidden="true"><b></b><b></b><b></b></i>';
      b.querySelector("em").textContent=String(i+1).padStart(2,"0");
      b.querySelector("strong").textContent=t.title;
      b.querySelector("small").textContent=t.artist;
      li.appendChild(b);list.appendChild(li);
    });
    // A clear layer that closes the panel on an outside tap. It has no colour: the screen behind is never dimmed.
    const shield=doc.createElement("div");shield.className="cmsMusicSheetShield";shield.hidden=true;shield.setAttribute("aria-hidden","true");
    doc.body.append(shield,el);
    const q=c=>el.querySelector(c);
    sheet={root:el,shield,list,kicker:q(".cmsMusicSheetText span"),title:q(".cmsMusicSheetText strong"),artist:q(".cmsMusicSheetText small"),play:q(".cmsMusicSheetPlay"),mute:q(".cmsMusicSheetMute"),
      bar:q(".cmsMusicSheetBar i"),times:el.querySelectorAll(".cmsMusicSheetTime small"),songs:Array.from(list.querySelectorAll(".cmsMusicSheetSong")),close:q(".cmsMusicSheetClose"),opener:null};
    sheet.play.addEventListener("click",()=>player().toggle());
    sheet.mute.addEventListener("click",()=>player().mute());
    q(".cmsMusicSheetPrev").addEventListener("click",()=>mdStep(-1));
    q(".cmsMusicSheetNext").addEventListener("click",()=>mdStep(1));
    sheet.close.addEventListener("click",()=>mdSheetClose());
    shield.addEventListener("click",()=>mdSheetClose());
    list.addEventListener("click",event=>{
      const b=event.target instanceof root.Element?event.target.closest("[data-soundtrack-track]"):null;
      if(b)mdPick(b.dataset.soundtrackTrack);
    });
    // Keyboard: Tab enters the list once (on the current song), the arrow keys, Home and End move between songs, and
    // Enter or Space plays the focused one (it is a real button).
    list.addEventListener("focusin",event=>{
      const b=event.target;
      if(sheet.songs.includes(b))sheet.songs.forEach(x=>{x.tabIndex=x===b?0:-1;});
    });
    list.addEventListener("keydown",event=>{
      const i=sheet.songs.indexOf(event.target);
      if(i<0||event.altKey||event.ctrlKey||event.metaKey)return;
      const last=sheet.songs.length-1;
      const to={ArrowDown:Math.min(last,i+1),ArrowUp:Math.max(0,i-1),Home:0,End:last,PageDown:Math.min(last,i+5),PageUp:Math.max(0,i-5)}[event.key];
      if(to===undefined)return;
      event.preventDefault();
      sheet.songs[to].focus();
    });
    return sheet;
  }

  // Phone: the sheet ends just above the tab bar, so the tabs stay usable. Desktop: it drops from the dock, under the top bar.
  function mdSheetPlace(){
    if(!sheet)return;
    const r=sheet.root.style,doc=root.document;
    if(root.innerWidth>PHONE_MAX){
      const bar=doc.querySelector(".sd-nav-top"),bb=bar&&bar.getBoundingClientRect(),db=dock&&dock.root.getBoundingClientRect();
      const top=Math.round((bb&&bb.height?bb.bottom:56)+8),width=Math.min(420,root.innerWidth-24);
      const left=Math.round(Math.max(12,Math.min(db&&db.width?db.left:root.innerWidth-width-12,root.innerWidth-width-12)));
      sheet.root.dataset.mode="desktop";r.setProperty("--cms-sheet-top",`${top}px`);r.setProperty("--cms-sheet-left",`${left}px`);r.setProperty("--cms-sheet-width",`${width}px`);
      sheet.shield.style.setProperty("--cms-sheet-bottom","0px");
      return;
    }
    const nav=doc.querySelector(".sd-nav-bottom"),box=nav&&nav.getBoundingClientRect();
    const bottom=box&&box.height>2&&box.top<root.innerHeight?Math.round(Math.max(0,root.innerHeight-box.top)):0;
    sheet.root.dataset.mode="phone";r.setProperty("--cms-sheet-bottom",`${bottom}px`);
    sheet.shield.style.setProperty("--cms-sheet-bottom",`${bottom}px`);
  }

  function mdSheetOpen(opener){
    if(!sheet&&!mdSheetBuild())return;
    sheet.opener=opener||null;
    mdSheetPlace();
    sheet.shield.hidden=false;sheet.root.hidden=false;
    mdRender();
    // The current song is scrolled to the middle of the list (instantly, so reduced motion is respected).
    const on=sheet.list.querySelector('[aria-current="true"]');
    if(on)sheet.list.scrollTop=Math.max(0,on.offsetTop-sheet.list.clientHeight/2+on.offsetHeight/2);
    root.requestAnimationFrame(()=>{if(sheet&&!sheet.root.hidden)sheet.root.dataset.open="true";});
    sheet.close.focus({preventScroll:true});
  }

  function mdSheetClose(){
    if(!sheet||sheet.root.hidden)return;
    sheet.root.hidden=true;sheet.shield.hidden=true;delete sheet.root.dataset.open;
    const back=sheet.opener;sheet.opener=null;
    if(back&&back.isConnected&&back.focus)back.focus({preventScroll:true});
    mdRender();
  }
  const mdSheetToggle=opener=>{if(sheet&&!sheet.root.hidden)mdSheetClose();else mdSheetOpen(opener);};

  // ---- desktop dock ----
  function mdBuildDock(host,before){
    const doc=root.document,el=doc.createElement("div");
    el.id="cmsMusicDockTop";el.className="cmsMusicDock";el.setAttribute("role","group");el.setAttribute("aria-label","Soundtrack");
    el.innerHTML='<span class="cmsMusicDockDisc" aria-hidden="true"></span><span class="cmsMusicDockText"><strong></strong><small></small></span>'+
      '<button class="cmsMusicDockPlay" type="button" aria-label="Play"></button>'+
      '<button class="cmsMusicDockMute" type="button" aria-label="Mute" disabled></button>'+
      `<button class="cmsMusicDockOpen" type="button" aria-expanded="false" aria-controls="cmsMusicSheet">${ICON.list}<span>TRACKS</span></button>`;
    host.insertBefore(el,before||null);
    dock={root:el,title:el.querySelector(".cmsMusicDockText strong"),artist:el.querySelector(".cmsMusicDockText small"),
      toggle:el.querySelector(".cmsMusicDockPlay"),mute:el.querySelector(".cmsMusicDockMute"),open:el.querySelector(".cmsMusicDockOpen")};
    dock.toggle.addEventListener("click",()=>player().toggle());
    dock.mute.addEventListener("click",()=>player().mute());
    dock.open.addEventListener("click",()=>mdSheetToggle(dock.open));
    return dock;
  }

  // The account chips sit at the right of the desktop bar (css/v10Shell.css, fixed). When the bar is too narrow for the
  // whole dock beside them, the artist line goes first, then the title, so the dock never touches a chip.
  function mdChipsLeft(bar){
    let left=Infinity;
    for(const id of ["onlinePlayerIdentityBadge","seasonIndicator"]){
      const el=root.document.getElementById(id),b=el&&el.getBoundingClientRect();
      if(b&&b.width>2&&b.height>2&&b.top<bar.bottom&&b.bottom>bar.top)left=Math.min(left,b.left);
    }
    const capsule=root.document.querySelector(".sd-nav-top .sd-nav-capsule"),c=capsule&&capsule.getBoundingClientRect();
    if(c&&c.width)left=Math.min(left,c.left);
    return left;
  }
  // The dock sits in the middle of the bar: the page's centre when that leaves a clear gap after the tabs, otherwise the
  // centre of the free space between the tabs and the account chips. When even that is too tight it shrinks (artist
  // line first, then the title) and, as a last step, steps out of the bar, so it never touches a tab or a chip.
  function mdFitTop(){
    if(!dock)return;
    const el=dock.root,prev=el.previousElementSibling;
    for(const mode of ["full","title","icon"]){
      el.dataset.fit=mode;el.style.marginLeft="";
      const box=el.getBoundingClientRect();
      if(!box.width)return;
      const start=prev?prev.getBoundingClientRect().right:el.parentNode.getBoundingClientRect().left;
      const end=mdChipsLeft(el.parentNode.getBoundingClientRect());
      const w=box.width,inFlow=box.left;
      let left=root.innerWidth/2-w/2;
      if(left<start+48)left=((start+(Number.isFinite(end)?end:root.innerWidth))/2)-w/2;
      left=Math.max(left,start+18);
      if(left+w+16<=end){el.style.marginLeft=`${Math.round(left-inFlow+parseFloat(root.getComputedStyle(el).marginLeft||0))}px`;return;}
    }
    el.style.marginLeft="";el.dataset.fit="none";
  }

  // ---- phone MUSIC tab: the sixth tab of the tab bar. The bar keeps its height, so nothing on any screen moves. ----
  function mdTabMount(){
    const doc=root.document,nav=doc.querySelector(".sd-nav-bottom");
    if(!nav||nav.querySelector(".cmsMusicTab"))return;
    const b=doc.createElement("button");
    b.type="button";b.id="cmsMusicTab";b.className="sd-nav-tab cmsMusicTab";b.setAttribute("aria-label","Music player");b.setAttribute("aria-controls","cmsMusicSheet");b.setAttribute("aria-expanded","false");
    b.innerHTML=`${ICON.disc}<span>MUSIC</span>`;
    b.addEventListener("click",()=>mdSheetToggle(b));
    nav.appendChild(b);
    mdRender();
  }

  // Home's TRACKS button is a label for a hidden checkbox (Team V markup). Under 900px the checkbox is turned straight back
  // off in the same task, before the old grid can paint, and the sheet opens instead.
  function mdHomeHook(){
    const doc=root.document,box=doc.getElementById("phoneTrackSheetToggle");
    if(!box||box.dataset.cmsSheet)return;
    box.dataset.cmsSheet="true";
    box.addEventListener("change",()=>{
      if(!box.checked||root.innerWidth>PHONE_MAX)return;
      box.checked=false;
      mdSheetOpen(doc.querySelector(".menuMusicTile .phoneTrackSheetOpen")||box);
    });
  }

  function mdMount(){
    const doc=root.document,top=doc.querySelector(".sd-nav-top");
    if(top&&!doc.getElementById("cmsMusicDockTop")){mdBuildDock(top,top.querySelector(".sd-nav-capsule"));mdRender();}
    mdTabMount();
    return Boolean(top);
  }

  function mdStart(){
    const api=player(),doc=root.document;
    mdHomeHook();
    if(started||!api||typeof api.subscribe!=="function"||!api.current())return false;
    started=true;
    api.subscribe(mdRender);
    mdSessionActions();
    mdMount();
    // The bars can be built (or rebuilt) after Home: mount into them as they appear.
    if(typeof root.MutationObserver==="function"){
      watching=new root.MutationObserver(mdMount);
      watching.observe(doc.body,{childList:true,subtree:true});
      new root.MutationObserver(()=>{mdSheetClose();root.requestAnimationFrame(mdFitTop);}).observe(doc.documentElement,{attributes:true,attributeFilter:["data-v10-screen","data-nav"]});
    }
    // Escape closes the player first (it is the top layer) and hands focus back to the button that opened it; a dialog
    // underneath (Settings) stays open until a second Escape.
    doc.addEventListener("keydown",event=>{
      if(event.key!=="Escape"||!sheet||sheet.root.hidden)return;
      event.stopPropagation();mdSheetClose();
    },true);
    doc.addEventListener("timeupdate",event=>{if(isAudio(event))mdTime();},true);
    doc.addEventListener("durationchange",event=>{if(isAudio(event))mdTime();},true);
    let wasPhone=root.innerWidth<=PHONE_MAX;
    root.addEventListener("resize",()=>{
      const phone=root.innerWidth<=PHONE_MAX;
      if(phone!==wasPhone){wasPhone=phone;mdSheetClose();}else mdSheetPlace();
      mdFitTop();
    });
    if(typeof root.ResizeObserver==="function"){const chips=doc.getElementById("topHeader");if(chips)new root.ResizeObserver(mdFitTop).observe(chips);}
    return true;
  }

  root.CareerModeMusicDockV10=Object.freeze({start:mdStart,state:()=>({docks:dock?[dock.root.id]:[],started,sheetOpen:Boolean(sheet&&!sheet.root.hidden),sheetMode:sheet?sheet.root.dataset.mode||null:null})});
})(typeof window!=="undefined"?window:globalThis);
