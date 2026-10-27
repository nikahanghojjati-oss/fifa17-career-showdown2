// r85 (Nik 2026-10-27): the lean soundtrack player docked in the app's bars on every screen but Home, which keeps its own
// strip. Desktop: inside the top bar after the tabs. Phone: a sixth MUSIC tab in the tab bar of the menu screens (Nik's
// pick: the in-game phone screens have no bar and keep their layout); it opens one panel above the bar with Play and the
// songs, so no screen loses any height. Both docks drive Home's one <audio> through window.HomeSoundtrack, so a
// song keeps playing across screens. Nothing here touches Firestore; Audius is only asked for a song after a Play tap.
// Looks: css/v10Shell.css (.cmsMusicDock).
(function(root){
  "use strict";
  if(!root||root.CareerModeMusicDockV10)return;
  const docks=[];
  let watching=null,started=false;
  const player=()=>root.HomeSoundtrack;
  const setText=(el,v)=>{if(el&&el.textContent!==String(v))el.textContent=String(v);};

  function mdRender(){
    const api=player(),t=api&&api.current&&api.current();
    if(!t)return;
    const s=api.state(),failed=Boolean(s.failed);
    docks.forEach(d=>{
      setText(d.title,t.title);
      setText(d.artist,failed?"STREAM UNAVAILABLE · PICK ANOTHER":t.artist);
      setText(d.toggle,s.wantPlaying?"PAUSE":"PLAY");
      d.toggle.setAttribute("aria-pressed",String(Boolean(s.wantPlaying)));
      d.toggle.setAttribute("aria-label",(s.wantPlaying?"Pause ":"Play ")+t.title);
      d.root.dataset.playing=String(Boolean(s.playing&&s.wantPlaying));
      d.root.dataset.failed=String(failed);
      d.choices.forEach(b=>{const on=b.dataset.soundtrackTrack===t.key;b.classList.toggle("selected",on);b.setAttribute("aria-pressed",String(on));});
    });
  }

  function mdCloseLists(except){
    docks.forEach(d=>{
      if(d===except||d.list.hidden)return;
      d.list.hidden=true;d.open.setAttribute("aria-expanded","false");
    });
  }

  const NOW='<span class="cmsMusicDockDisc" aria-hidden="true"></span><span class="cmsMusicDockText"><strong></strong><small></small></span><button class="cmsMusicDockPlay" type="button">PLAY</button>';
  function mdBuildDock(id,host,before,tab){
    const doc=root.document,dock=doc.createElement("div"),api=player();
    dock.id=id;dock.className=tab?"cmsMusicDock cmsMusicDockTab":"cmsMusicDock";dock.setAttribute("role","group");dock.setAttribute("aria-label","Soundtrack");
    dock.innerHTML=tab?
      '<button class="cmsMusicDockOpen sd-nav-tab" type="button" aria-expanded="false"><span class="cmsMusicDockDisc" aria-hidden="true"></span><span>MUSIC</span></button>'+
        `<div class="cmsMusicDockList" role="group" aria-label="Soundtrack" hidden><div class="cmsMusicDockNow">${NOW}</div><div class="cmsMusicDockSongs"></div></div>`:
      `${NOW}<button class="cmsMusicDockOpen" type="button" aria-expanded="false">TRACKS</button>`+
        '<div class="cmsMusicDockList" role="group" aria-label="Choose soundtrack" hidden><div class="cmsMusicDockSongs"></div></div>';
    const list=dock.querySelector(".cmsMusicDockList"),open=dock.querySelector(".cmsMusicDockOpen"),songs=dock.querySelector(".cmsMusicDockSongs");
    list.id=`${id}List`;open.setAttribute("aria-controls",list.id);
    api.tracks().forEach((t,i)=>{
      const b=doc.createElement("button");
      b.type="button";b.className="cmsMusicDockChoice";b.dataset.soundtrackTrack=t.key;
      b.innerHTML="<em></em><strong></strong><small></small>";
      b.querySelector("em").textContent=String(i+1).padStart(2,"0");
      b.querySelector("strong").textContent=t.title;
      b.querySelector("small").textContent=t.artist;
      songs.appendChild(b);
    });
    host.insertBefore(dock,before||null);
    const d={root:dock,list,open,title:dock.querySelector(".cmsMusicDockText strong"),artist:dock.querySelector(".cmsMusicDockText small"),
      toggle:dock.querySelector(".cmsMusicDockPlay"),choices:Array.from(songs.children)};
    d.toggle.addEventListener("click",()=>player().toggle());
    open.addEventListener("click",()=>{
      const show=list.hidden;
      mdCloseLists(d);
      list.hidden=!show;open.setAttribute("aria-expanded",String(show));
      const on=show&&list.querySelector(".selected");
      if(on&&on.scrollIntoView)on.scrollIntoView({block:"nearest"});
    });
    list.addEventListener("click",event=>{
      const b=event.target instanceof root.Element?event.target.closest("[data-soundtrack-track]"):null;
      if(b){if(!tab)mdCloseLists();player().choose(b.dataset.soundtrackTrack);if(!tab)open.focus();}
    });
    docks.push(d);
    return d;
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
  // When even the smallest dock would touch a chip (a narrow desktop window with long chips) it steps out of the bar.
  function mdFitTop(){
    const d=docks.find(x=>x.root.id==="cmsMusicDockTop");
    if(!d)return;
    for(const mode of ["full","title","icon","none"]){
      d.root.dataset.fit=mode;
      if(mode==="none")return;
      const box=d.root.getBoundingClientRect();
      if(!box.width||box.right+16<=mdChipsLeft(d.root.parentNode.getBoundingClientRect()))return;
    }
  }

  function mdMountDocks(){
    const doc=root.document,top=doc.querySelector(".sd-nav-top"),bottom=doc.querySelector(".sd-nav-bottom");
    if(top&&!doc.getElementById("cmsMusicDockTop")){mdBuildDock("cmsMusicDockTop",top,top.querySelector(".sd-nav-capsule"));mdRender();mdFitTop();}
    if(bottom&&!doc.getElementById("cmsMusicDockBottom")){mdBuildDock("cmsMusicDockBottom",bottom,null,true);mdRender();}
    return Boolean(top&&bottom);
  }

  function mdStart(){
    const api=player(),doc=root.document;
    if(started||!api||typeof api.subscribe!=="function"||!api.current())return false;
    started=true;
    api.subscribe(mdRender);
    if(!mdMountDocks()&&typeof root.MutationObserver==="function"){
      watching=new root.MutationObserver(()=>{if(mdMountDocks()){watching.disconnect();watching=null;}});
      watching.observe(doc.body,{childList:true,subtree:true});
    }
    doc.addEventListener("click",event=>{if(!(event.target instanceof root.Element)||!event.target.closest(".cmsMusicDock"))mdCloseLists();});
    doc.addEventListener("keydown",event=>{if(event.key==="Escape")mdCloseLists();});
    root.addEventListener("resize",mdFitTop);
    if(typeof root.MutationObserver==="function"){
      new root.MutationObserver(()=>{mdCloseLists();root.requestAnimationFrame(mdFitTop);}).observe(doc.documentElement,{attributes:true,attributeFilter:["data-v10-screen","data-nav"]});
    }
    if(typeof root.ResizeObserver==="function"){const chips=doc.getElementById("topHeader");if(chips)new root.ResizeObserver(mdFitTop).observe(chips);}
    return true;
  }

  root.CareerModeMusicDockV10=Object.freeze({start:mdStart,state:()=>({docks:docks.map(d=>d.root.id),started})});
})(typeof window!=="undefined"?window:globalThis);
