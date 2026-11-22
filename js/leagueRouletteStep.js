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
@media not all and (min-width:901px) and (orientation:landscape){
  html.lr3d-room[data-v10-setup="league"] #background,html.lr3d-room[data-v10-setup="league"][data-v10-screen] #background{
    background-color:#0b0908!important;background-image:url(visual-assets/v10_1/plates-hc/ENV_BOX_ROOM_LR_PHONE_V1.webp)!important;
    background-size:cover!important;background-position:50% 58%!important}
  #leagueWheel.lr3d-on{--lr-lift:0px}
}
@media (max-width:900px) and (orientation:portrait){
  #app #leagueWheelScreen.v26Skin.lr3d-on,#app #leagueWheelScreen.v26Skin.lr3d-on :is(.wheelPointer,#leagueWheel){--v26-wheel:min(88vw,calc(100svh - 330px),640px)!important}
  #app #leagueWheelScreen.v26Skin.lr3d-on .wheelPointer{margin-top:4px!important}
  #app #leagueWheelScreen.v26Skin.lr3d-on #leagueWheel{margin-bottom:14px!important}
  #leagueWheel.lr3d-on>.lr3dHost{height:calc(100% * 1.18 / .917);top:calc(50% - 50% * 1.18 / .917)}
}
@media (max-width:900px) and (orientation:landscape){
  #app #leagueWheelScreen.v26Skin.lr3d-on:not(.hidden){--v26-wheel:min(calc(100svh - 84px),48vw)!important;
    grid-template-columns:var(--v26-wheel) minmax(0,250px)!important;grid-template-rows:auto auto auto auto!important;align-content:center!important;column-gap:22px!important}
  #app #leagueWheelScreen.v26Skin.lr3d-on>h2{grid-column:2!important;grid-row:1!important;width:min(30vw,250px)!important;margin:0 auto!important}
  #app #leagueWheelScreen.v26Skin.lr3d-on #selectedLeague{grid-column:2!important;grid-row:2!important;align-self:center!important}
  #app #leagueWheelScreen.v26Skin.lr3d-on #leagueStateNote{grid-column:2!important;grid-row:2!important}
  #app #leagueWheelScreen.v26Skin.lr3d-on #leagueWheel,#app #leagueWheelScreen.v26Skin.lr3d-on .wheelPointer{grid-column:1!important;grid-row:1 / 5!important;transform:none!important}
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
  // On a desktop window the room plate (ENV_BOX_PLATE_HC_V3, 1536x864, drawn "cover" on #background) has Daniel left and
  // Nik right. The board is placed in the plate's own pixels: as large as it can be (at most 30% larger than the 2D wheel's
  // box, 389 plate px) while every row of its silhouette keeps MARGIN plate px from both men's outlines, its top clears the
  // title lines and its foot clears the buttons. Phones and tablets have no men (CSS below) and keep the box placement.
  const DESKTOP_MQ="(min-width:901px) and (orientation:landscape)";
  const PLATE={w:1536,h:864},BASE_HOST=389,MAX_GROW=1.30,MIN_GROW=.80,MARGIN=12;
  // The men's outlines, traced on the plate: Daniel's right edge and Nik's left edge, x at plate y (pointing hand at 397).
  const DANIEL=[[0,400],[250,395],[280,440],[300,475],[330,490],[360,500],[385,515],[397,530],[412,530],[425,492],[440,478],[470,462],[500,456],[550,490],[600,525],[650,575],[864,600]];
  const NIK=[[0,1075],[250,1085],[270,1060],[290,1040],[310,1010],[340,985],[370,970],[400,965],[864,962]];
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
    for(const el of screen.querySelectorAll("h2,#selectedLeague,#leagueStateNote")){const r=lrsVisibleRect(el);if(r)textBottom=Math.max(textBottom,r.bottom);}
    for(const el of screen.querySelectorAll("button")){const r=lrsVisibleRect(el);if(r)buttonsTop=Math.min(buttonsTop,r.top);}
    if(!Number.isFinite(textBottom)||!Number.isFinite(buttonsTop))return null;
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
  let layoutRaf=0,lastBox="";
  function lrsLayout(){
    if(!host)return;const wheel=host.parentNode;if(!wheel||typeof wheel.getBoundingClientRect!=="function")return;
    if(!lrsShown())return;
    const box=lrsDesktopBox();host.style.removeProperty("visibility");
    if(!box){if(lastBox){lastBox="";host.style.removeProperty("left");host.style.removeProperty("top");host.style.removeProperty("width");host.style.removeProperty("height");}return;}
    const w=wheel.getBoundingClientRect(),key=[box.left-w.left,box.top-w.top,box.size].map(v=>Math.round(v)).join(",");
    if(key===lastBox)return;lastBox=key;
    const [l,t,z]=key.split(",");host.style.left=`${l}px`;host.style.top=`${t}px`;host.style.width=`${z}px`;host.style.height=`${z}px`;
  }
  function lrsLayoutSoon(){if(layoutRaf||typeof root.requestAnimationFrame!=="function")return;layoutRaf=root.requestAnimationFrame(()=>{layoutRaf=0;lrsLayout();});}
  let layoutWatching=false;
  function lrsWatchLayout(){if(layoutWatching||typeof root.addEventListener!=="function")return;layoutWatching=true;root.addEventListener("resize",lrsLayoutSoon,{passive:true});}

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

  return Object.freeze({contractVersion:1,feature:"cms-league-roulette-step",screenId:SCREEN_ID,
    arm:lrsArm,armed:()=>armed,holding:lrsHolding,ensure:lrsEnsure,sync:lrsSync,stage:lrsStage,busy:lrsBusy,caughtUp:lrsCaughtUp,leagueOut:lrsLeagueOut,failed:()=>failed,on:lrsOn,dispose:lrsTeardown});
});
