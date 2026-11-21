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
@media (max-width:700px) and (orientation:portrait){#leagueWheel.lr3d-on{--lr-scale:1.3;--lr-lift:-14px}}
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
  }
  function lrsTeardown(){
    generation+=1;
    const was=scene;scene=null;mountPromise=null;playing=null;planKey="";
    if(was){try{was.dispose();}catch(_error){}}
    if(host){host.remove();host=null;}
    lrsSetOn(false);
  }
  // Leaving Select League frees the board (its GPU memory counts against the iPhone budget); coming back mounts it again
  // on the ledger as it stands.
  function lrsWatchScreen(){
    if(screenObserver||typeof root.MutationObserver!=="function")return;
    const screen=lrsById(SCREEN_ID);if(!screen)return;
    screenObserver=new root.MutationObserver(()=>{if(!lrsShown()&&(scene||mountPromise))lrsTeardown();});
    screenObserver.observe(screen,{attributes:true,attributeFilter:["class"]});
  }

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
      scene=made;lrsSetOn(true);
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
  function lrsCatchUp(){
    if(playing)return playing;
    const run=(async()=>{
      for(let guard=0;guard<8&&lrsAlive();guard+=1){
        const s=scene;
        if(!target.winner)return;
        const key=`${target.seed}|${target.winner}`;
        if(planKey!==key){if(s.stage!==0||s.busy||!s.setPlan(target.seed,target.winner))return;planKey=key;}
        if(s.stage>=target.drops)return;
        if(target.instant){s.showStage(target.drops);lrsEmit("merged",{stage:s.stage});return;}
        const index=s.stage;lrsEmit("rolling",{index});
        await s.drop(index);
        if(scene!==s)return;
      }
    })();
    playing=run;
    run.finally(()=>{if(playing===run)playing=null;lrsEmit("settled",{stage:lrsStage()});});
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
