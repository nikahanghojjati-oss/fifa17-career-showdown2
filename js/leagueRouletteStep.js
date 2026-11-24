(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.CareerModeLeagueRouletteStep=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";
  // R98-01 League Roulette on the live Select League screen (Nik 2026-11-20, option A).
  //
  // The shared setup decides everything: the league (commit-league, Daniel's first ball) and how many of the four balls
  // have dropped (the ledger's `drops`, each ball written by the manager whose turn it is). This module only shows it:
  //   - the 3D roulette (js/leagueRouletteScene3d.js) stands on the counter where the 2D wheel stood, in #leagueWheel;
  //   - lrsSync({seed, winner, drops}) moves the board to the ledger: a ball the ledger gained while the screen is up rolls,
  //     a ball dropped before the screen opened (a reload, a late join, coming back from Home) is shown at once and never
  //     rolls again;
  //   - Reus Gate: while armed, css/v10 holds Select League (js/v10Setup.js asks lrsHolding()) until the board has drawn its
  //     first frame; where 3D cannot run (no WebGL, a crash) the screen opens on the plain wheel and the text steps.
  // No Firestore here: no read, no write, no listener.
  const SCREEN_ID="leagueWheelScreen";
  const SCENE=Object.freeze(["league-roulette-3d","js/leagueRouletteScene3d.js",()=>Boolean(root.CareerModeLeagueRoulette3d)]);
  const STYLE_ID="leagueRouletteStepStyle";
  // The bowl's rim is as wide as the 2D wheel was (--lr-scale of it; wider on a phone, where the counter has the room),
  // and the bowl's foot sits where the wheel's bottom edge was (--lr-lift keeps it clear of the buttons on a wide screen and
  // under the counter lip, below the heroes' hands, on a phone), so js/v10Setup.js still lays the counter lip under it.
  // Scene geometry (js/leagueRouletteScene3d.js): rim width .917 of the host, foot at .91 of the host.
  const CSS=`
#leagueWheel.lr3d-on{--lr-scale:1;background:none!important;border-color:transparent!important;box-shadow:none!important;overflow:visible!important}
#leagueWheel.lr3d-on::before,#leagueWheel.lr3d-on::after{display:none!important}
#leagueWheel.lr3d-on>:not(.lr3dHost),#leagueWheelScreen.lr3d-on .wheelPointer{visibility:hidden!important}
#leagueWheel>.lr3dHost{position:absolute;z-index:1;pointer-events:none;
  width:calc(100% * var(--lr-scale,1) / .917);height:calc(100% * var(--lr-scale,1) / .917);
  left:calc(50% - 50% * var(--lr-scale,1) / .917);top:calc(100% - 91% * var(--lr-scale,1) / .917 - var(--lr-lift,0px))}
#leagueWheel.lr3d-on{--lr-lift:14px}
@media (prefers-reduced-motion:no-preference){#leagueWheel>.lr3dHost.lr3dPlaced{transition:left .35s ease,top .35s ease}}
/* Team V HO-097 (Nik OK 2026-11-22): the League Roulette's own rooms. Desktop: the box room with the two men further apart
   (ENV_BOX_PLATE_HC_V4, same frame and anchors as V3), so the board grows between them. Phones and tablets: the same room
   without the men, upright (PHONE_HC_V4, TALL on 9:20 phones) and sideways (SIDEWAYS_HC_V4). Only while the 3D board is
   on (html.lr3d-room); the 2D wheel keeps the V3 rooms it was placed in. */
@media (min-width:901px) and (orientation:landscape){
  html.lr3d-room[data-v10-setup="league"] #background,html.lr3d-room[data-v10-setup="league"][data-v10-screen] #background{background-image:url(visual-assets/v10_1/plates-hc/ENV_BOX_PLATE_HC_V4_1X.webp)!important}
  html.lr3d-room:is([data-assets="2"],[data-assets="3"],[data-assets="4"])[data-v10-setup="league"] #background{background-image:image-set(url(visual-assets/v10_1/plates-hc/ENV_BOX_PLATE_HC_V4_1X.webp) 1x,url(visual-assets/v10_1/plates-hc/ENV_BOX_PLATE_HC_V4_2X.webp) 2x)!important}
}
@media (min-width:1537px) and (orientation:landscape),(min-width:901px) and (min-height:865px) and (orientation:landscape){
  html.lr3d-room[data-v10-setup="league"] #background,html.lr3d-room[data-v10-setup="league"][data-v10-screen] #background{background-image:image-set(url(visual-assets/v10_1/plates-hc/ENV_BOX_PLATE_HC_V4_1920.webp) 1.25x)!important}
  html.lr3d-room:is([data-assets="2"],[data-assets="3"],[data-assets="4"])[data-v10-setup="league"] #background,html.lr3d-room:is([data-assets="2"],[data-assets="3"],[data-assets="4"])[data-v10-setup="league"][data-v10-screen] #background{background-image:image-set(url(visual-assets/v10_1/plates-hc/ENV_BOX_PLATE_HC_V4_1920.webp) 1.25x,url(visual-assets/v10_1/plates-hc/ENV_BOX_PLATE_HC_V4_2X.webp) 2x)!important}
}
@media not all and (min-width:901px) and (orientation:landscape){
  html.lr3d-room[data-v10-setup="league"] #background,html.lr3d-room[data-v10-setup="league"][data-v10-screen] #background{
    background-color:#0b0908!important;background-image:url(visual-assets/v10_1/plates-hc/ENV_BOX_PHONE_HC_V4.webp)!important;
    background-size:cover!important;background-position:50% 50%!important}
  html.lr3d-room[data-assets="0"][data-v10-setup="league"] #background{background-image:url(visual-assets/v10_1/plates-hc/ENV_BOX_PHONE_HC_V4_590W.webp)!important}
  #leagueWheel.lr3d-on{--lr-lift:0px}
}
@media (orientation:portrait) and (max-aspect-ratio:59/128){
  html.lr3d-room[data-v10-setup="league"] #background,html.lr3d-room[data-v10-setup="league"][data-v10-screen] #background{background-image:url(visual-assets/v10_1/plates-hc/ENV_BOX_PHONE_HC_V4_TALL.webp)!important}
  html.lr3d-room[data-assets="0"][data-v10-setup="league"] #background{background-image:url(visual-assets/v10_1/plates-hc/ENV_BOX_PHONE_HC_V4_TALL_590W.webp)!important}
}
@media (max-width:900px) and (orientation:landscape){
  html.lr3d-room[data-v10-setup="league"] #background,html.lr3d-room[data-v10-setup="league"][data-v10-screen] #background,html.lr3d-room[data-assets="0"][data-v10-setup="league"] #background{background-image:url(visual-assets/v10_1/plates-hc/ENV_BOX_SIDEWAYS_HC_V4.webp)!important}
}
@media (max-width:900px) and (orientation:portrait){
  #app #leagueWheelScreen.v26Skin.lr3d-on,#app #leagueWheelScreen.v26Skin.lr3d-on :is(.wheelPointer,#leagueWheel){--v26-wheel:min(88vw,calc(100svh - 330px),640px)!important}
  #app #leagueWheelScreen.v26Skin.lr3d-on .wheelPointer{margin-top:4px!important}
  #app #leagueWheelScreen.v26Skin.lr3d-on #leagueWheel{margin-bottom:14px!important}
  #leagueWheel.lr3d-on>.lr3dHost{height:calc(100% * 1.18 / .917);top:calc(50% - 50% * 1.18 / .917)}
}
@media (min-width:640px) and (max-width:900px) and (max-height:440px) and (orientation:landscape){
  #app #leagueWheelScreen.v26Skin.lr3d-on:not(.hidden){--v26-wheel:min(calc(100svh - 84px),48vw)!important;
    grid-template-columns:var(--v26-wheel) minmax(0,250px)!important;grid-template-rows:repeat(6,auto)!important;align-content:center!important;column-gap:22px!important}
  #app #leagueWheelScreen.v26Skin.lr3d-on>h2{grid-column:2!important;grid-row:1!important;width:min(30vw,250px)!important;margin:0 auto!important}
  #app #leagueWheelScreen.v26Skin.lr3d-on #selectedLeague{grid-column:2!important;grid-row:2!important;align-self:center!important}
  #app #leagueWheelScreen.v26Skin.lr3d-on #sharedShowdownPresentationStatus{grid-column:2!important;grid-row:3!important;margin:0!important;font-size:12px!important;line-height:1.3!important}
  #app #leagueWheelScreen.v26Skin.lr3d-on #leagueStateNote{grid-column:2!important;grid-row:4!important}
  #app #leagueWheelScreen.v26Skin.lr3d-on #spinLeague{grid-column:2!important;grid-row:5!important}
  #app #leagueWheelScreen.v26Skin.lr3d-on .wheelContainer>.backButton,#app #leagueWheelScreen.v26Skin.lr3d-on #spinLeague.hidden+.backButton{grid-column:2!important;grid-row:6!important}
  #app #leagueWheelScreen.v26Skin.lr3d-on #leagueWheel,#app #leagueWheelScreen.v26Skin.lr3d-on .wheelPointer{grid-column:1!important;grid-row:1 / 7!important;transform:none!important}
}
`;
  let armed=false,failed=false,scene=null,host=null,mountPromise=null,generation=0,playing=null,planKey="",screenObserver=null;
  let target={seed:"",winner:null,drops:0,instant:false};
  // The board mounts on the ledger as the screen first renders it (never on a guess), so a ball dropped before the screen
  // opened is shown at once instead of rolling again.
  let synced=null,markSynced=()=>{};
  function lrsFreshSync(){synced=new Promise(resolve=>{markSynced=resolve;});}
  lrsFreshSync();
  const listeners=new Set();

  function lrsEmit(type,data){for(const fn of [...listeners]){try{fn(type,data||{});}catch(_error){}}}
  function lrsDoc(){return root.document||null;}
  function lrsById(id){const d=lrsDoc();return d&&typeof d.getElementById==="function"?d.getElementById(id):null;}
  function lrsAlive(){return Boolean(scene&&scene.alive);}
  function lrsShown(){const el=lrsById(SCREEN_ID);return Boolean(el&&!el.classList.contains("hidden"));}
  function lrsStyle(){
    const d=lrsDoc();if(!d||lrsById(STYLE_ID))return;
    const el=d.createElement("style");el.id=STYLE_ID;el.textContent=CSS;(d.head||d.documentElement).appendChild(el);
  }
  async function lrsLoad(){
    const [key,path,ready]=SCENE;if(ready())return true;
    if(typeof root.loadRuntimeScript!=="function")return false;
    await root.loadRuntimeScript(key,path,ready);return ready();
  }
  // The held screen opens: js/v10Screens.js draws it now that frame() no longer answers HOLD.
  function lrsRelease(){try{const screens=root.CareerModeV10Screens;if(screens&&typeof screens.show==="function")void screens.show(SCREEN_ID).catch(()=>{});}catch(_error){}}
  function lrsSetOn(on){
    const wheel=lrsById("leagueWheel"),screen=lrsById(SCREEN_ID);
    if(wheel)wheel.classList.toggle("lr3d-on",on);if(screen)screen.classList.toggle("lr3d-on",on);
    // phones and tablets: the room without the two men behind the big board (Nik 2026-11-22)
    const html=lrsDoc()&&lrsDoc().documentElement;if(html)html.classList.toggle("lr3d-room",on);
    if(!on)lrsLiftLine(false);
  }
  function lrsTeardown(){
    generation+=1;
    const was=scene;scene=null;mountPromise=null;playing=null;planKey="";
    if(was){try{was.dispose();}catch(_error){}}
    if(host){host.remove();host=null;}lastBox="";
    lrsSetOn(false);
  }
  // Leaving Select League frees the board (its GPU memory counts against the iPhone budget); coming back mounts it again
  // on the ledger as it stands.
  function lrsWatchScreen(){
    if(screenObserver||typeof root.MutationObserver!=="function")return;
    const screen=lrsById(SCREEN_ID);if(!screen)return;
    screenObserver=new root.MutationObserver(()=>{if(!lrsShown()){if(scene||mountPromise)lrsTeardown();}else lrsLayoutSoon();});
    screenObserver.observe(screen,{attributes:true,attributeFilter:["class"]});
  }


  // ---- Desktop placement (Nik 2026-11-22: bigger, never touching either man) ----------------------------------------
  // On a desktop window the room plate (ENV_BOX_PLATE_HC_V4, 1536x864, drawn "cover" on #background) has Daniel left and
  // Nik right. The board is placed in the plate's own pixels: as large as it can be (at most 45% larger than the 2D wheel's
  // box, 389 plate px) while every row of its silhouette keeps MARGIN plate px from both men's outlines, its top clears the
  // title lines and its foot clears the buttons. Phones and tablets have no men (CSS below) and keep the box placement.
  const DESKTOP_MQ="(min-width:901px) and (orientation:landscape)";
  const PLATE={w:1536,h:864},BASE_HOST=389,MAX_GROW=1.45,MIN_GROW=.80,MARGIN=12;
  // The men's outlines on the V4 plate (Team V HO-097: the men 60 plate px further apart each), measured against Team V's
  // empty room (ENV_BOX_PLATE_EMPTY_HC_V4, the same pixels without the men): Daniel's right edge and Nik's left edge, x at
  // plate y, each the outermost point within 12 px above or below (pointing hand at y 400-420). Below the lip (652) the
  // counter covers both; the line runs on from there.
  const DANIEL=[[0,302],[80,302],[100,332],[120,344],[140,351],[160,352],[180,354],[200,354],[220,343],[240,334],[260,334],[280,329],[300,338],[320,398],[340,422],[360,432],[380,442],[400,466],[420,466],[440,443],[460,448],[480,456],[500,461],[520,470],[540,476],[560,484],[580,493],[600,498],[620,504],[640,516],[660,516],[864,540]];
  const NIK=[[0,1150],[90,1150],[100,1150],[120,1150],[140,1144],[160,1150],[180,1150],[200,1147],[220,1147],[240,1150],[260,1150],[280,1150],[300,1150],[320,1128],[340,1090],[360,1046],[380,1029],[400,1028],[420,1024],[440,1026],[460,1032],[480,1032],[500,1033],[520,1038],[540,1046],[560,1052],[580,1060],[600,1070],[620,1082],[640,1096],[660,1116],[864,1140]];
  // The board's silhouette in its host box (rendered and measured): half-width at each 1/40 of the host's height, from .175.
  const PROFILE_TOP=.16,PROFILE_BOTTOM=.955;
  const PROFILE=[.169,.23,.278,.314,.344,.37,.39,.409,.424,.435,.446,.453,.459,.463,.463,.463,.461,.459,.453,.448,.439,.427,.412,.398,.381,.36,.338,.308,.273,.232,.169,.062];
  function lrsEdge(line,y){for(let i=1;i<line.length;i+=1){const [y0,x0]=line[i-1],[y1,x1]=line[i];if(y<=y1)return x0+(x1-x0)*Math.max(0,(y-y0)/(y1-y0||1));}return line[line.length-1][1];}
  function lrsPlate(){
    const bg=lrsById("background");if(!bg||typeof root.getComputedStyle!=="function")return null;
    const r=bg.getBoundingClientRect(),cs=root.getComputedStyle(bg);if(!r.width||!r.height)return null;
    const s=Math.max(r.width/PLATE.w,r.height/PLATE.h);
    const pos=String(cs.backgroundPosition||"50% 50%").split(" "),off=(v,free)=>/%$/.test(v)?free*parseFloat(v)/100:parseFloat(v)||0;
    return {s,x0:r.left+off(pos[0]||"50%",r.width-PLATE.w*s),y0:r.top+off(pos[1]||"50%",r.height-PLATE.h*s)};
  }
  function lrsVisibleRect(el){if(!el||!el.offsetParent)return null;const r=el.getBoundingClientRect();return r.width&&r.height?r:null;}
  // The board's box in screen px, or null where the box placement stands (phones, no plate, nothing fits).
  function lrsDesktopBox(){
    if(typeof root.matchMedia!=="function"||!root.matchMedia(DESKTOP_MQ).matches)return null;
    const P=lrsPlate(),screen=lrsById(SCREEN_ID);if(!P||!screen)return null;
    let textBottom=-Infinity,buttonsTop=Infinity;
    for(const el of screen.querySelectorAll("h2,#selectedLeague")){const r=lrsVisibleRect(el);if(r)textBottom=Math.max(textBottom,r.bottom);}
    // the lock note shows above the buttons once the league is set: the board keeps clear of it too (Codex, PR #1564)
    // r98 gallery: so is the shared flow's status line (js/productionSharedShowdownPresentation.js, "BOTH PLAYERS CONNECTED ·
    // Drop the first ball." and the rest), which every shared Showdown shows above the buttons.
    for(const el of screen.querySelectorAll("button,#leagueStateNote,#sharedShowdownPresentationStatus")){const r=lrsVisibleRect(el);if(r)buttonsTop=Math.min(buttonsTop,r.top);}
    if(!Number.isFinite(textBottom)||!Number.isFinite(buttonsTop))return null;
    // (Claude review on #1564) the search runs again only when what it depends on has changed
    const memo=[P.s,P.x0,P.y0,textBottom,buttonsTop].map(v=>Math.round(v*100)).join(",");
    if(memo===boxMemo.key)return boxMemo.box;
    boxMemo.key=memo;boxMemo.box=lrsSearchBox(P,textBottom,buttonsTop);return boxMemo.box;
  }
  const boxMemo={key:"",box:null};
  function lrsSearchBox(P,textBottom,buttonsTop){
    const fits=(hw,cx,top)=>{ // plate px: host width, centre x, host top
      for(let k=0;k<PROFILE.length;k+=1){
        const y=top+hw*(.175+k*.025),half=hw*PROFILE[k];
        if(cx-half<lrsEdge(DANIEL,y)+MARGIN||cx+half>lrsEdge(NIK,y)-MARGIN)return false;
      }
      return true;
    };
    const yMin=(textBottom+10-P.y0)/P.s,yMax=(buttonsTop-10-P.y0)/P.s; // plate y the silhouette may use
    for(let grow=MAX_GROW;grow>=MIN_GROW-1e-9;grow-=.01){
      const hw=BASE_HOST*grow,h=hw*(PROFILE_BOTTOM-PROFILE_TOP);if(h>yMax-yMin)continue;
      // the foot as low as it may go (on the counter, toward the buttons), then higher; the centre near the window's middle
      for(let foot=yMax;foot-h>=yMin;foot-=4){
        const top=foot-hw*PROFILE_BOTTOM;
        for(const dx of [0,-6,6,-12,12,-18,18,-24,24,-30,30,-36,36,-42,42]){const cx=745+dx;
          if(fits(hw,cx,top))return {left:P.x0+(cx-hw/2)*P.s,top:P.y0+top*P.s,size:hw*P.s,grow};}
      }
    }
    return null;
  }
  // Nik 2026-11-22 (card: "Move the line up"): on desktop the SPIN TO PICK THE LEAGUE line rises to sit just under the title's
  // letters, so the board gains that height. Only the line moves (a transform: the title, the buttons and the page keep their
  // places). The title's letters end 59% down its box at every desktop size measured (56-59%); 62% is used, and the gap is
  // 13% of the title box (17 px at 1920x866).
  function lrsLiftLine(on){
    const line=lrsById("selectedLeague"),screen=lrsById(SCREEN_ID);if(!line)return;
    line.style.removeProperty("transform");if(!on||!screen)return;
    const title=lrsVisibleRect(screen.querySelector("h2")),r=lrsVisibleRect(line);if(!title||!r)return;
    const want=title.top+title.height*.62+Math.max(14,title.height*.13)-r.height*.3,shift=Math.min(0,Math.round(want-r.top));
    if(shift<0)line.style.transform=`translateY(${shift}px)`;
  }
  let layoutRaf=0,lastBox="";
  function lrsLayout(){
    if(!host)return;const wheel=host.parentNode;if(!wheel||typeof wheel.getBoundingClientRect!=="function")return;
    if(!lrsShown())return;
    lrsLiftLine(typeof root.matchMedia==="function"&&root.matchMedia(DESKTOP_MQ).matches);
    const box=lrsDesktopBox();host.style.removeProperty("visibility");
    if(!box){if(lastBox){lastBox="";host.style.removeProperty("left");host.style.removeProperty("top");host.style.removeProperty("width");host.style.removeProperty("height");}return;}
    const w=wheel.getBoundingClientRect(),key=[box.left-w.left,box.top-w.top,box.size].map(v=>Math.round(v)).join(",");
    if(key===lastBox)return;lastBox=key;
    const [l,t,z]=key.split(",");host.style.left=`${l}px`;host.style.top=`${t}px`;host.style.width=`${z}px`;host.style.height=`${z}px`;
    // once placed, a later move (the lock note showing) glides instead of jumping; the first placement never animates
    if(!host.classList.contains("lr3dPlaced")&&typeof root.requestAnimationFrame==="function"){const placed=host;root.requestAnimationFrame(()=>placed.classList.add("lr3dPlaced"));}
  }
  function lrsLayoutSoon(){if(layoutRaf||typeof root.requestAnimationFrame!=="function")return;layoutRaf=root.requestAnimationFrame(()=>{layoutRaf=0;lrsLayout();});}
  let layoutWatching=false;
  function lrsWatchLayout(){if(layoutWatching||typeof root.addEventListener!=="function")return;layoutWatching=true;root.addEventListener("resize",lrsLayoutSoon,{passive:true});
    // (Claude review on #1564) anything that moves the lines or buttons the board keeps clear of places it again: the lock
    // note, the result line's text and size (data-v26-league), a button shown or hidden. Each place is one cheap measurement
    // and changes nothing that is watched here (the host's own style is not watched), so it cannot loop.
    const screen=lrsById(SCREEN_ID);
    if(screen&&typeof root.MutationObserver==="function")new root.MutationObserver(lrsLayoutSoon).observe(screen,{attributes:true,attributeFilter:["class","hidden","data-v26-league"],childList:true,characterData:true,subtree:true});}

  function lrsArm(on){
    if(!on){lrsTeardown();failed=false;target={seed:"",winner:null,drops:0,instant:false};lrsFreshSync();}
    armed=Boolean(on);
    return armed;
  }
  // js/v10Setup.js: hold Select League (the loading screen stays) while the armed board is not drawn yet.
  function lrsHolding(){return armed&&!failed&&!lrsAlive();}

  function lrsEnsure(){
    if(!armed||failed)return Promise.resolve(null);
    const wheel=lrsById("leagueWheel");if(!wheel)return Promise.resolve(null);
    if(lrsAlive()&&host&&host.parentNode===wheel)return Promise.resolve(scene);
    if(mountPromise)return mountPromise;
    lrsTeardown();
    const gen=generation;
    lrsStyle();lrsWatchScreen();
    const box=lrsDoc().createElement("div");box.className="lr3dHost";box.setAttribute("aria-hidden","true");
    // a desktop board waits, unseen, for its place in the room (measured once the screen shows), so it never jumps
    if(typeof root.matchMedia==="function"&&root.matchMedia(DESKTOP_MQ).matches)box.style.visibility="hidden";
    host=box;wheel.classList.add("lr3d-on");wheel.appendChild(box);
    const run=(async()=>{
      let made=null;
      try{
        if(await lrsLoad()){
          await synced;if(gen!==generation||!armed)return null;
          const R=root.CareerModeLeagueRoulette3d,first=target;
          made=await R.mount(box,{seed:first.seed,winner:first.winner||undefined,stage:first.winner?first.drops:0});
          if(made&&first.winner)planKey=`${first.seed}|${first.winner}`;
        }
      }catch(_error){made=null;}
      if(gen!==generation||!armed){if(made){try{made.dispose();}catch(_error){}}return null;}
      if(!made){failed=true;box.remove();if(host===box)host=null;lrsSetOn(false);lrsRelease();lrsEmit("failed");return null;}
      scene=made;lrsSetOn(true);lrsWatchLayout();lrsLayout();
      made.on((type,data)=>lrsEmit(type,data));
      lrsRelease();lrsEmit("ready",{stage:made.stage});
      void lrsCatchUp();
      return made;
    })();
    mountPromise=run;
    run.finally(()=>{if(mountPromise===run)mountPromise=null;});
    return run;
  }

  // The board follows the ledger. instant: show it as it stands (a Showdown opened before the roulette).
  function lrsSync(next){
    const drops=Math.max(0,Math.min(4,Number(next&&next.drops)|0));
    target={seed:String(next&&next.seed||""),winner:next&&next.winner||null,drops,instant:Boolean(next&&next.instant)};
    markSynced();
    if(lrsAlive())void lrsCatchUp();
  }
  // Something for the board to do: a plan to take (before the first ball) or a ball the ledger holds that it has not shown.
  function lrsBehind(){
    if(!lrsAlive()||!target.winner)return false;
    return planKey!==`${target.seed}|${target.winner}`||scene.stage<target.drops;
  }
  // "settled" is told only after the board has shown something, so a screen that answers it by syncing again (the
  // presentation re-renders on every event) never loops; and the run is the playback guard before any event goes out.
  function lrsCatchUp(){
    if(playing)return playing;
    if(!lrsBehind())return Promise.resolve();
    let shown=false;
    const run=(async()=>{
      await null;
      for(let guard=0;guard<8&&lrsAlive();guard+=1){
        const s=scene;
        if(!target.winner)return;
        const key=`${target.seed}|${target.winner}`;
        if(planKey!==key){if(s.stage!==0||s.busy||!s.setPlan(target.seed,target.winner))return;planKey=key;}
        if(s.stage>=target.drops)return;
        shown=true;
        if(target.instant){s.showStage(target.drops);lrsEmit("merged",{stage:s.stage});return;}
        const index=s.stage;lrsEmit("rolling",{index});
        await s.drop(index);
        if(scene!==s)return;
      }
    })();
    playing=run;
    run.catch(()=>{}).finally(()=>{if(playing===run)playing=null;if(shown)lrsEmit("settled",{stage:lrsStage()});});
    return run;
  }

  function lrsStage(){return lrsAlive()?scene.stage:0;}
  function lrsBusy(){return Boolean(playing)||Boolean(lrsAlive()&&scene.busy);}
  // Every ball the ledger holds has been shown (or there is no board to show it on).
  function lrsCaughtUp(){return failed||!armed||(lrsAlive()&&!lrsBusy()&&scene.stage>=target.drops);}
  // The league name for a ball already rested (the plan both phones share), for the screen's words.
  function lrsLeagueOut(index){const p=lrsAlive()?scene.plan:null;return p&&p.drops[index]?p.drops[index].league:null;}
  function lrsOn(fn){listeners.add(fn);return()=>listeners.delete(fn);}

  // Phoenix W5: a new Showdown (or the ended one let go on Home) puts this module's Showdown data back to a fresh page's (the reset in js/persistentNikDanielPair.js).
  try{(root.CareerModeShowdownClears||(root.CareerModeShowdownClears={}))["league-roulette"]=()=>{if(root.getActiveScreenName?.()===SCREEN_ID)return "skip";lrsTeardown();target={seed:"",winner:null,drops:0,instant:false};lrsFreshSync();};}catch(_error){}
  return Object.freeze({contractVersion:1,feature:"cms-league-roulette-step",screenId:SCREEN_ID,
    arm:lrsArm,armed:()=>armed,holding:lrsHolding,ensure:lrsEnsure,sync:lrsSync,stage:lrsStage,busy:lrsBusy,caughtUp:lrsCaughtUp,leagueOut:lrsLeagueOut,failed:()=>failed,on:lrsOn,dispose:lrsTeardown});
});
