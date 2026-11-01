(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeRivalryLegacyV10=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";
  // JOB-28: pure, read-only frames for Team V's current rivalry and completed History.
  const node=typeof module!=="undefined"&&module.exports;
  const seam=()=>node?require("./careerScreenSeam.js"):root.CareerModeCareerScreenSeam;
  // Shell-cached Team V files live under the runtime ?v= URL, so fetch them the same way (offline first launch).
  const assetUrl=path=>typeof root.optionalAssetUrl==="function"?root.optionalAssetUrl(path):path;
  const BASE="visual-assets/v10_1/",ORDER=["daniel","nik"],STATES=["loading","empty","unavailable","partial","ready"];
  const FIELDS=["seasonWins","seasonDraws","seasonLosses","championsLeagues","leagueTitles","domesticCups","totalTrophies","hundredPointSeasons","hundredGoalSeasons","topScorerSeasons","topAssistSeasons","perfectSeasons","bestSeasonScore"];
  const finite=x=>typeof x==="number"&&Number.isFinite(x);
  const pair=x=>x&&ORDER.every(k=>finite(x[k]));
  const copy=x=>JSON.parse(JSON.stringify(x));
  function rlFreeze(x){if(x&&typeof x==="object"&&!Object.isFrozen(x)){Object.values(x).forEach(rlFreeze);Object.freeze(x);}return x;}
  function bare(status){return {status,managerOrder:ORDER.slice()};}
  function validSeason(s){return s&&Number.isInteger(s.season)&&["daniel","nik","draw"].includes(s.winner)&&["score","leaguePosition","leaguePoints","leagueGoals"].every(k=>pair(s[k]));}
  function validRow(r){return r&&Number.isInteger(r.number)&&typeof r.leagueId==="string"&&r.clubs&&ORDER.every(k=>typeof r.clubs[k]==="string")&&finite(r.seasonsPlayed)&&finite(r.totalSeasons)&&pair(r.totals)&&["daniel","nik","draw"].includes(r.winner)&&Array.isArray(r.seasons)&&r.seasons.every(validSeason);}
  // r84 Golden Showdown: the managers who closed this finished 10-season Showdown on 110 points (the seam owns the rule). Only a
  // Showdown that has one carries the field.
  function golden(row){const managers=seam().goldenShowdownManagers(row);return managers.length?{goldenShowdown:managers}:{};}
  // r86 Special Player chip (js/specialPlayerChip.js): a Showdown confirmed on r86 or later carries each manager's Special
  // Player; an older one carries no field (no chip).
  const chipApi=()=>node?require("./specialPlayerChip.js"):root.CareerModeSpecialPlayerChip;
  function special(sp){return sp&&sp.daniel&&sp.nik?{specialPlayers:{daniel:sp.daniel,nik:sp.nik}}:{};}
  function rowSpecial(row){try{return special(chipApi()?.forRow?.(row));}catch(_){return {};}}
  function liveSpecial(){try{return special(chipApi()?.live?.());}catch(_){return {};}}
  function historyFrame(model){
    const status=seam().careerScreenView("legacy",model).status;
    if(status==="loading"||status==="unavailable")return bare(status);
    const rows=model?.history?.showdowns;
    if(!Array.isArray(rows))return bare("unavailable");
    const completed=rows.filter(r=>r.status==="completed");
    if(!completed.every(validRow))return bare("unavailable");
    // r80: an Ended early Showdown is listed as one status-only row (date, seasons played); it never counts anywhere.
    const listed=rows.filter(r=>r.status==="completed"||(r.status==="abandoned"&&Number.isInteger(r.number)));
    const frame={...bare(status==="ready"&&!listed.length?"empty":status),showdowns:listed.map(r=>r.status==="abandoned"?{number:r.number,status:"abandoned",endedAt:r.endedAt??null,seasonsPlayed:r.seasonsPlayed??null,endedLabel:seam().endedEarlyText(r)}:{number:r.number,status:"completed",leagueId:r.leagueId,clubs:copy(r.clubs),seasonsPlayed:r.seasonsPlayed,totalSeasons:r.totalSeasons,totals:copy(r.totals),winner:r.winner,seasons:copy(r.seasons),...golden(r),...rowSpecial(r)}),ui:{page:1,pageSize:4,selectedShowdown:completed[0]?.number??null}};
    if(status==="partial")frame.coverage=copy(model.coverage);
    // Current-only projections are never offered as an archive or backfilled.
    if(model.interimLabel){frame.status="unavailable";return bare("unavailable");}
    return frame;
  }
  function rivalryFrame(model){
    let status,source,lifecycle=null,sp={};
    if(model?.history){
      status=seam().careerScreenView("rivalryStatistics",model).status;
      if(status==="loading"||status==="unavailable")return bare(status);
      const row=model.history.showdowns[0];
      if(!row||["abandoned","unavailable"].includes(row.status))return bare(status==="empty"?"empty":"unavailable");
      source={status,leagueId:row.leagueId,clubs:row.clubs,score:row.totals,totalSeasons:row.totalSeasons,seasons:row.seasons,managers:model.managers};lifecycle=row.status;sp=rowSpecial(row);
    }else{source=model;status=STATES.includes(source?.status)?source.status:"unavailable";lifecycle=source?.lifecycle??null;sp=liveSpecial();}
    if(status==="loading"||status==="unavailable")return bare(status);
    if(status==="empty"&&!source.managers)return {...bare("empty"),seasons:[],transfers:{status:"unavailable"}};
    if(!source.managers||!ORDER.every(k=>source.managers[k]&&FIELDS.every(f=>finite(source.managers[k][f])||(f==="bestSeasonScore"&&source.managers[k][f]===null))))return bare("unavailable");
    if(!Array.isArray(source.seasons)||!source.seasons.every(validSeason))return bare("unavailable");
    if(status!=="empty"&&(!pair(source.score)||!finite(source.totalSeasons)||!source.clubs||!ORDER.every(k=>typeof source.clubs[k]==="string")))return bare("unavailable");
    const frame={...bare(status),leagueId:source.leagueId??null,clubs:source.clubs?{daniel:source.clubs.daniel,nik:source.clubs.nik}:null,totalSeasons:source.totalSeasons??null,score:source.score?{daniel:source.score.daniel,nik:source.score.nik}:null,managerRecords:Object.fromEntries(ORDER.map(k=>[k,Object.fromEntries([...FIELDS,...(finite(source.managers[k].europaLeagues)?["europaLeagues"]:[])].map(f=>[f,source.managers[k][f]]))])),seasons:copy(source.seasons),transfers:{status:"unavailable"},ui:{lifecycle},...golden({status:lifecycle,totalSeasons:source.totalSeasons,seasonsPlayed:source.seasons.length,totals:source.score}),...sp};
    if(status==="partial"){
      if(!source.coverage||!Number.isInteger(source.coverage.readable)||!Number.isInteger(source.coverage.indexed))return bare("unavailable");
      frame.coverage=copy(source.coverage);
    }
    return frame;
  }
  function rlToV10Frame(model,screen){
    if(!["legacy","rivalryStatistics"].includes(screen))throw new TypeError("RIVALRY_LEGACY_V10_UNKNOWN");
    return rlFreeze(screen==="legacy"?historyFrame(model):rivalryFrame(model));
  }
  // Lazy browser binding; model providers remain the existing read-only adapters.
  const APP={legacy:"legacy",rivalryStatistics:"statistics"};
  const DIR={legacy:"legacy",rivalryStatistics:"rivalry-statistics"};
  const BOOT={legacy:"ShowdownLegacyBoot",rivalryStatistics:"ShowdownRivalryStatisticsBoot"};
  const sources={},sourceKeys={},getters={},resources={},originalMarkup={},reloads={};
  const LOAD_TIMEOUT=15000,RELOAD_INTERVAL=2000;
  const LOADING=rlFreeze({status:"loading"}),UNAVAILABLE=rlFreeze({status:"unavailable"});
  let registration=null,installed=false,tabletLayoutCleanup=null,legacyLayoutCleanup=null;
  const screens=()=>root.CareerModeV10Screens;
  const state=name=>{try{return root[name]?.getState?.()??null;}catch(_){return null;}};
  const identity=()=>state("CareerModeOnlinePlayerIdentity");
  // The career start marker's epoch changes only when the marker changes, so a switch drops the cached career.
  const markerEpoch=()=>{try{return root.CareerModeCareerStartMarker?.epoch?.()??0;}catch(_){return 0;}};
  // CE2PG: after a Showdown closes the pair holds no rivalry id but names the closed one, so a career read after Showdown A
  // and one after Showdown B no longer share a key (Standings and Settings showed A's career after B had finished).
  const context=()=>{const pair=state("CareerModePersistentNikDanielPair");return JSON.stringify([state("CareerModeSparkConnectedAccount")?.accountId??null,identity()?.managerId??null,pair?.rivalryId??null,pair?.closedRivalryId??null,markerEpoch()]);};
  const report=error=>root.reportApplicationError?.("History and stats screens could not load",error);
  const load=(key,file,global)=>root.loadRuntimeScript(key,file,()=>Boolean(root[global]));
  async function modelDependencies(){
    for(const [key,file,global] of [
      ["career-history-protocol","js/sharedHistoryConvergence.js","CareerModeSharedHistoryConvergence"],
      ["career-final-protocol","js/sharedFinalReconciliation.js","CareerModeSharedFinalReconciliation"],
      ["career-terminal-protocol","js/sharedTerminalClose.js","CareerModeSharedTerminalClose"],
      ["career-analytics","js/sharedCareerAnalytics.js","CareerModeSharedCareerAnalytics"],
      ["career-active-adapter","js/sharedActiveShowdownAdapter.js","CareerModeSharedActiveShowdownAdapter"],
      ["career-closed-adapter","js/sharedClosedShowdownAdapter.js","CareerModeSharedClosedShowdownAdapter"],
      ["career-completed-reader","js/sparkCompletedShowdownReader.js","CareerModeSparkCompletedShowdownReader"],
      ["career-summary-store","js/careerSummaryStore.js","CareerModeCareerSummaryStore"],
      ["career-closed-loader","js/sparkClosedShowdownCareerLoader.js","CareerModeSparkClosedShowdownCareerLoader"]
    ])await load(key,file,global);
  }
  function rlSnapshot(){return {identity:identity(),pair:state("CareerModePersistentNikDanielPair"),history:state("CareerModeProductionSharedHistoryConvergence"),multiSeason:state("CareerModeProductionSharedMultiSeasonProgression"),finalReconciliation:state("CareerModeProductionSharedFinalReconciliation"),terminalClose:state("CareerModeProductionSharedTerminalClose")};}
  function markup(screen){if(node)require("./rivalryLegacyV10Markup.js");return root.CareerModeRivalryLegacyMarkup?.[screen]??"";}
  function source(screen){
    const model=getters[screen]?.();
    if(model!=null)return model;
    // Signed in or not, Team V draws the screen; only Legacy's data tools page keeps the app's own markup.
    return screen==="legacy"&&root.careerModeLegacyDataTools===true?null:(sourceKeys[screen]===context()?sources[screen]??UNAVAILABLE:UNAVAILABLE);
  }
  function clean(screen){
    if(screen==="rivalryStatistics"){tabletLayoutCleanup?.();tabletLayoutCleanup=null;}
    if(screen==="legacy"){legacyLayoutCleanup?.();legacyLayoutCleanup=null;root.LEGACY_BOOT?.cleanup?.();root.LegacyFixture?.stageController?.destroy?.();}
    else{root.rvStage?.destroy?.();root.rvStage=null;}
  }
  function draw(screen,model,host){
    clean(screen);
    // Job 13 retains hidden stages. Remove those before using the shared stage-root id.
    for(const id of ["careerStatistics","trophyRoom"]){const other=root.document.getElementById(id);if(other?.dataset.careerV10==="1"){screens().hide(id);other.remove();}}
    if(host.dataset.rivalryLegacyV10!=="1")originalMarkup[screen]=host.innerHTML;
    host.dataset.rivalryLegacyV10="1";host.innerHTML=markup(screen);
    // Team V's History frame has no Back control (the shared bar covers it), but the product keeps a .backButton for smart Back.
    if(screen==="legacy"){const layer=host.querySelector?.(".sd-stage__layer--ui"),back=layer&&root.document.createElement?.("button");if(back){back.id="legacyBack";back.type="button";back.className="backButton legacyBackV10 sd-btn sd-btn--secondary";back.innerHTML="<span class=\"legacyBackFull\">BACK TO HOME</span><span class=\"legacyBackShort\" aria-hidden=\"true\">BACK</span>";back.setAttribute("aria-label","Back to main menu");layer.appendChild(back);}}
    const frame=copy(rlToV10Frame(model,screen)),data={strings:resources[screen].strings,frames:{LIVE:frame}};
    if(screen==="legacy")root.LEGACY_BOOT={fixtures:data,platemap:resources[screen].map};
    else root.RIVALRY_BOOT={fixtures:data,platemap:resources[screen].map};
    // JOB-1657: Season, Standings and Final-winner shells also carry id="stage-root". Team V's scripts take the first one in the
    // document, which is the hidden 0x0 Season stage, so the plate and both managers mounted into nothing. While they boot,
    // only this screen's stage owns the id; the other shells get it back right after (nothing is removed or moved).
    const strayStages=Array.from(root.document.querySelectorAll?.('[id="stage-root"]')||[]).filter(node=>!host.contains(node));
    for(const node of strayStages)node.removeAttribute("id");
    try{root[BOOT[screen]]();}
    finally{for(const node of strayStages)node.id="stage-root";}
    if(screen==="legacy"){
      // JOB-1704: the adopted touch compositions show one card without an inner
      // swipe scroller. Team V still owns selection, arrows, keys and paging.
      // Mark its current card for CSS, including records without season detail.
      const grid=host.querySelector("#legacyCardGrid");
      const syncCard=()=>{
        const cards=Array.from(grid?.querySelectorAll(".legacyCard")||[]);
        const selected=root.LegacyFixture?.selectedShowdown;
        const current=cards.find(card=>Number(card.dataset.showdown)===Number(selected))||cards[0];
        cards.forEach(card=>card.classList.toggle("legacyVisibleCard",card===current));
      };
      syncCard();
      const observer=grid&&root.MutationObserver?new root.MutationObserver(syncCard):null;
      observer?.observe(grid,{childList:true,subtree:true,attributes:true,attributeFilter:["data-selected"]});
      const touch=root.matchMedia?.("(max-width:900px) and (orientation:portrait), (min-width:600px) and (max-width:900px) and (max-height:500px) and (orientation:landscape)");
      const syncKey=event=>{
        if(touch?.matches&&["ArrowLeft","ArrowRight"].includes(event.key)){
          syncCard();grid.querySelector(".legacyVisibleCard")?.focus?.({preventScroll:true});
        }
      };
      grid?.addEventListener("keydown",syncKey);
      legacyLayoutCleanup=()=>{observer?.disconnect();grid?.removeEventListener("keydown",syncKey);};
    }
    if(screen==="legacy"&&frame.status==="unavailable"){
      const banner=host.querySelector("#legacyStateBanner"),retry=banner&&root.document.createElement?.("button");
      if(retry){retry.type="button";retry.className="sd-btn sd-btn--secondary";retry.textContent="TRY AGAIN";retry.style.gridColumn="1 / -1";retry.style.justifySelf="center";retry.addEventListener("click",()=>{void refresh(screen).catch(report);});banner.appendChild(retry);}
    }
    const title=host.querySelector(screen==="legacy"?"#legacyHeading":"#statisticsScreenTitle");
    if(title){title.tabIndex=-1;title.setAttribute("data-route-focus-target","true");host.setAttribute("aria-labelledby",title.id);}
    if(screen==="rivalryStatistics"){
      const tabs=Array.from(host.querySelectorAll("[data-rv-tab]")),shell=host.querySelector("#rivalryStatisticsContent");
      // JOB-1601: expose both live panes only in the adopted tablet range.
      const tablet=root.matchMedia?.("(min-width:700px) and (max-width:900px) and (orientation:portrait)");
      const panelKeys=["totals","head","seasons","trophies"];
      const panels=panelKeys.map(key=>host.querySelector("#rvPanel"+({totals:"Totals",head:"Head",seasons:"Seasons",trophies:"Trophies"}[key])));
      let previousHidden=null;
      const syncTabletPanels=()=>{
        if(!tablet)return;
        const key=shell.getAttribute("data-tab")||"totals";
        if(tablet?.matches){
          if(!previousHidden)previousHidden=panels.map(p=>Boolean(p?.hidden));
          panels.forEach((p,i)=>{if(p)p.hidden=panelKeys[i]!=="totals"&&panelKeys[i]!== (key==="totals"?"head":key);});
        }else if(previousHidden){
          const usedHidden=previousHidden.some(Boolean);
          panels.forEach((p,i)=>{if(p)p.hidden=usedHidden?panelKeys[i]!==key:previousHidden[i];});
          previousHidden=null;
        }
      };
      const pick=(key,focus)=>{shell.setAttribute("data-tab",key);tabs.forEach(t=>{const on=t.dataset.rvTab===key;t.setAttribute("aria-selected",String(on));t.tabIndex=on?0:-1;if(on&&focus)t.focus();});syncTabletPanels();};
      tablet?.addEventListener?.("change",syncTabletPanels);
      tabletLayoutCleanup=()=>tablet?.removeEventListener?.("change",syncTabletPanels);
      syncTabletPanels();
      tabs.forEach((t,i)=>{t.addEventListener("click",()=>pick(t.dataset.rvTab));t.addEventListener("keydown",e=>{const d=e.key==="ArrowRight"?1:e.key==="ArrowLeft"?-1:0;if(d){e.preventDefault();pick(tabs[(i+d+tabs.length)%tabs.length].dataset.rvTab,true);}});});
    }
  }
  function undraw(screen,host){if(reloads[screen]?.flight)reloads[screen].flight.left=true;clean(screen);host.innerHTML=originalMarkup[screen]??"";delete host.dataset.rivalryLegacyV10;}
  async function registerRivalryLegacy(){
    if(!registration)registration=(async()=>{
      await load("v10-screens","js/v10Screens.js","CareerModeV10Screens");
      await load("rivalry-legacy-v10-markup","js/rivalryLegacyV10Markup.js","CareerModeRivalryLegacyMarkup");
      await load("visual-identity","js/visualIdentity.js","getClubCrestSvg");
      const api=screens().install();
      for(const screen of Object.keys(APP)){
        const base=DIR[screen]+"/";
        api.register(APP[screen],{
          css:[base+DIR[screen]+".css","../../css/rivalryLegacyV10.css"],
          js:[["v10-"+DIR[screen],base+DIR[screen]+".js",()=>typeof root[BOOT[screen]]==="function"]],
          // The Special Player draw loads with the screen's own files, so its chip is in the first frame (never rejects).
          prepare:async()=>{const chip=load("special-player-chip","js/specialPlayerChip.js","CareerModeSpecialPlayerChip").then(()=>root.CareerModeSpecialPlayerChip.ensure()).catch(()=>false);const responses=await Promise.all([root.fetch(assetUrl(BASE+base+"strings.json")),root.fetch(assetUrl(BASE+base+"assets/platemap.json"))]);await chip;if(responses.some(r=>!r.ok))throw new Error("RIVALRY_LEGACY_RESOURCES_UNAVAILABLE");const [strings,map]=await Promise.all(responses.map(r=>r.json()));resources[screen]={strings,map};},
          frame:()=>source(screen),mount:(model,host)=>draw(screen,model,host),unmount:host=>undraw(screen,host)
        });
      }
      if(!installed){
        installed=true;
        const events={"career-mode-online-identity-change":"CareerModeOnlinePlayerIdentity","career-mode-connected-account-state-change":"CareerModeSparkConnectedAccount","career-mode-shared-history-convergence-state-change":"CareerModeProductionSharedHistoryConvergence","career-mode-shared-terminal-close-state-change":"CareerModeProductionSharedTerminalClose","career-mode-career-start-change":"CareerModeCareerStartMarker"};
        for(const [event,provider] of Object.entries(events)){
          const signature=value=>JSON.stringify([context(),value?.phase??null,value?.status??null,value?.acceptedRevisionKey?value.throughSeason??null:null,value?.acceptedRevisionKey??null]);
          let last=signature(state(provider));
          root.addEventListener?.(event,change=>{
            const next=signature(change?.detail??state(provider));if(next===last)return;last=next;
            for(const screen of Object.keys(APP))if(screens().isMounted(APP[screen]))void refresh(screen,true).catch(report);
          });
        }
      }
      return api;
    })().catch(error=>{registration=null;throw error;});
    return registration;
  }
  // One provider-backed completed-Showdown career model for every online career screen (History here,
  // Career Statistics and Trophy Room, and the Standings Career view). Same exact gets and services as
  // before; the last result is kept in memory for the current account, manager and pair only.
  // careerLoadSequence orders overlapping loads: only the newest started load may publish the shared cache.
  let careerCache=null,careerLoadSequence=0;
  // Career start marker (js/careerStartMarker.js, lazily loaded; one exact get per account per page load once it exists).
  // r80 (Nik 2026-10-19: test runs never count anywhere, a real game is never hidden): with a marker, the Showdowns it
  // names are hidden, except a Showdown finished on r79 or later (Nik 2026-10-19 20:35 UTC: show r79 onward, #941 reverted;
  // careerHiddenRivalryIds in js/careerStartMarker.js, fail-closed); every later one is
  // real (both START paths write the marker before the Showdown enters the index). Without a marker every Showdown in the
  // index is a test run (a real one cannot exist yet), so nothing is shown; "no marker" is asked again at each load, so a
  // real career started on another browser shows here. A marker that cannot be read hides everything (fail-closed); the
  // screens reload once a read answers (career-mode-career-start-change).
  async function rlCareerScope(services,getDoc,user){
    await load("career-start-marker","js/careerStartMarker.js","CareerModeCareerStartMarker");
    const marker=root.CareerModeCareerStartMarker;
    if(typeof marker?.readMarker!=="function")throw new Error("CAREER_START_UNAVAILABLE");
    const value=await marker.readMarker({firestore:services.firestore,firebaseSdk:{...services.firestoreSdk,getDoc},accountId:user.uid,recheckNone:true});
    if(value?.status==="ready")return {testOnly:false,hidden:typeof marker.careerHiddenRivalryIds==="function"?await marker.careerHiddenRivalryIds({marker:value,firestore:services.firestore,firebaseSdk:{...services.firestoreSdk,getDoc},accountId:user.uid}):marker.hiddenRivalryIds(value)};
    if(value?.status==="none")return {testOnly:true,hidden:[]};
    throw new Error("CAREER_START_UNKNOWN");
  }
  // Rivalry Statistics shows a just-finished Showdown from live state. A hidden or test one (or one whose account cannot be
  // checked) must not show; the career model below then decides.
  async function rlCurrentHidden(rivalryId){
    try{
      const account=state("CareerModeSparkConnectedAccount"),runtime=root.CareerModeProductionFirebaseRuntime;
      if(typeof rivalryId!=="string"||!account?.connected||!runtime)return false;
      const services=(root.CareerModeFirestoreBudget?.services||(s=>s))(await runtime.ensureAccountServices()),user=services?.auth?.currentUser;
      if(!services?.ok||!user||user.uid!==account.accountId)return false;
      const sdk=(root.CareerModeFirestoreBudget?.meterSdk||(s=>s))(services.firestoreSdk?.getDoc?services.firestoreSdk:await import(runtime.firebaseFirestoreModule));
      const scope=await rlCareerScope(services,sdk.getDoc,user);
      return scope.testOnly||scope.hidden.includes(rivalryId);
    }catch(_){return true;}
  }
  async function rlLoadCareerModel(canPublish=()=>true,rivalry=false,onProgress=null){
    const key=context(),sequence=++careerLoadSequence;
    await modelDependencies();
    const active=root.CareerModeSharedActiveShowdownAdapter.buildActiveShowdownViews(rlSnapshot());
    const account=state("CareerModeSparkConnectedAccount"),runtime=root.CareerModeProductionFirebaseRuntime;
    let model,rivalryModel;
    if(!account?.connected||!runtime)model=UNAVAILABLE;
    else{
      const services=(root.CareerModeFirestoreBudget?.services||(s=>s))(await runtime.ensureAccountServices()),user=services?.auth?.currentUser;
      if(!services?.ok||!user||user.uid!==account.accountId)model=UNAVAILABLE;
      else{
        // Reuse the configured SDK host and memory-only services. This only adds an exact-get
        // function to the reader argument; it changes no auth scope, provider setting or Rules.
        const sdk=(root.CareerModeFirestoreBudget?.meterSdk||(s=>s))(services.firestoreSdk?.getDoc?services.firestoreSdk:await import(runtime.firebaseFirestoreModule));
        let scope=null;try{scope=await rlCareerScope(services,sdk.getDoc,user);}catch(_){scope=null;}
        if(!scope){model=UNAVAILABLE;rivalryModel=UNAVAILABLE;}
        else{
          const hidden=scope.hidden;
          const result=await root.CareerModeSparkClosedShowdownCareerLoader.loadClosedShowdownCareer({firestore:services.firestore,firebaseSdk:{...services.firestoreSdk,getDoc:sdk.getDoc,setDoc:sdk.setDoc},user,current:active.careerInput,...(typeof onProgress==="function"?{onProgress}:{}),...(scope.testOnly?{testRunsOnly:true}:hidden.length?{hiddenRivalryIds:hidden}:{})},()=>canPublish()&&context()===key);
          model=result.model??UNAVAILABLE;
          if(rivalry){
            // Career order is oldest first. Rebuild the latest verified completed entry,
            // never mix whole-career manager counters into one rivalry's figures.
            const input=result.careerInput,entry=input?.showdowns?.filter(item=>item.classification!=="abandoned").at(-1);
            rivalryModel=input?.indexStatus==="ready"?(entry?.classification==="completed"?root.CareerModeSharedCareerAnalytics.buildCareerModel({indexStatus:"ready",showdowns:[entry]}):entry?.classification==="unavailable"?UNAVAILABLE:{status:"empty"}):UNAVAILABLE;
          }
        }
      }
    }
    if(canPublish()&&context()===key&&sequence===careerLoadSequence){careerCache={key,model};if(typeof root.CustomEvent==="function")root.dispatchEvent?.(new root.CustomEvent("career-mode-online-career-model-change"));}
    return rivalry?rivalryModel??UNAVAILABLE:model;
  }
  const rlCachedCareerModel=()=>careerCache&&careerCache.key===context()?careerCache.model:null;
  const rlOwner=key=>{try{return JSON.stringify(JSON.parse(key).slice(0,2));}catch(_){return null;}};
  function refresh(screen,event=false){
    const key=context(),reload=reloads[screen]??(reloads[screen]={flight:null,timer:null,dirty:false,lastStarted:-Infinity});
    const supplied=getters[screen]?.();
    if(supplied!=null){screens().invalidate(APP[screen]);return screens().show(APP[screen]);}
    // Never retain another account's frame while its old request finishes. r82 (Nik: Legacy panels show, vanish, then
    // load again): the same account and manager keep their frame while the pair or marker settles; the reload replaces it.
    if(sourceKeys[screen]!==key){
      const sameOwner=sourceKeys[screen]!=null&&rlOwner(sourceKeys[screen])===rlOwner(key);
      sourceKeys[screen]=key;
      if(!sameOwner){
        sources[screen]=LOADING;
        if(reload.flight||event&&Date.now()-reload.lastStarted<RELOAD_INTERVAL)void screens().show(APP[screen]).catch(report);
      }
    }
    if(reload.flight){/* a flight the screen left cannot publish; reopening schedules a fresh load after it drains */if(event||reload.flight.key!==key||reload.flight.left)reload.dirty=true;return reload.flight.promise;}
    const delay=RELOAD_INTERVAL-(Date.now()-reload.lastStarted);
    if(event&&delay>0){reload.dirty=true;scheduleReload(screen,reload,delay);return Promise.resolve(false);}
    if(reload.timer!==null){root.clearTimeout(reload.timer);reload.timer=null;}
    reload.dirty=false;reload.lastStarted=Date.now();
    // r83: opening the screen again retries an earlier "unavailable" read, so it shows loading, not the old card first.
    if(!event&&sources[screen]===UNAVAILABLE)sources[screen]=LOADING;
    const flight={key,alive:true,promise:null};reload.flight=flight;
    flight.promise=(async()=>{
      let timeout,fail;
      // r86 (Sol S61-r85-04): an inactivity deadline, not a flat cut. Each Showdown read restarts the 15 s, so a long cold
      // career keeps loading while records arrive; first-entry History says how far it got (never partial totals).
      const arm=()=>{root.clearTimeout(timeout);timeout=root.setTimeout(()=>{flight.alive=false;fail(new Error("RIVALRY_LEGACY_LOAD_TIMEOUT"));},LOAD_TIMEOUT);};
      const progress=({done,total}={})=>{
        if(!flight.alive||flight.left||context()!==key)return;arm();
        if(screen==="legacy"&&sources[screen]===LOADING&&Number.isInteger(done)&&Number.isInteger(total)&&total>0)rlShowProgress(screen,done,total);
      };
      try{
        // Only first entry shows LOADING. Reloads leave the last ready/partial/error frame visible.
        await screens().show(APP[screen]);
        const deadline=new Promise((_,reject)=>{fail=reject;arm();});
        const loading=(async()=>{
          if(screen==="rivalryStatistics"){
            await modelDependencies();
            const active=root.CareerModeSharedActiveShowdownAdapter.buildActiveShowdownViews(rlSnapshot());
            if(["none","abandoned","completed"].includes(active.classification)&&(active.rivalry.status!=="ready"||await rlCurrentHidden(active.careerInput?.showdowns?.[0]?.rivalryId)))return rlLoadCareerModel(()=>flight.alive&&!flight.left,true,progress);
            return {...active.rivalry,lifecycle:active.classification};
          }
          return rlLoadCareerModel(()=>flight.alive&&!flight.left,false,progress);
        })();
        const model=await Promise.race([loading,deadline]);
        if(context()!==key||flight.left)return false;
        // r82 (Codex JOB-B B3/B6): a reload that returns the same career keeps the frame already shown (no second boot).
        const shown=sources[screen];if(shown&&shown!==LOADING&&shown!==UNAVAILABLE&&model&&JSON.stringify(shown)===JSON.stringify(model))return true;
        sources[screen]=model;return await screens().show(APP[screen]);
      }catch(error){if(context()!==key||flight.left)return false;sources[screen]=UNAVAILABLE;await screens().show(APP[screen]);report(error);return false;}
      finally{
        flight.alive=false;root.clearTimeout(timeout);reload.flight=null;
        if(reload.dirty)scheduleReload(screen,reload,Math.max(0,RELOAD_INTERVAL-(Date.now()-reload.lastStarted)));
      }
    })();
    return flight.promise;
  }
  // Writes only the loading banner's text in place (no new frame, no remount, so nothing flashes).
  function rlShowProgress(screen,done,total){
    try{
      const copy=root.document?.getElementById?.(APP[screen])?.querySelector?.("#legacyStateBanner")?.querySelector?.(".legacyStateCopy");
      if(copy)copy.textContent=`Loading your Showdown history… ${Math.min(done,total)} of ${total}`;
    }catch(_){}
  }
  function scheduleReload(screen,reload,delay){
    if(reload.timer!==null)return;
    reload.timer=root.setTimeout(()=>{
      reload.timer=null;const dirty=reload.dirty;reload.dirty=false;
      if(dirty&&screens().isMounted(APP[screen]))void refresh(screen,true).catch(report);
    },delay);
  }
  function wrap(screen){
    const name=screen==="legacy"?"renderLegacy":"renderRivalryStatistics",original=root[name];
    if(typeof original!=="function"||original.rivalryLegacyV10)return;
    const wrapped=function(request=false){const result=original(request);const host=root.document.getElementById(APP[screen]);if(host?.dataset.rivalryLegacyV10==="1"){screens().invalidate(APP[screen]);void refresh(screen).catch(report);}return result;};
    wrapped.rivalryLegacyV10=true;root[name]=wrapped;
  }
  async function rlMount(screen,getModel){
    if(!Object.hasOwn(APP,screen))throw new TypeError("RIVALRY_LEGACY_V10_UNKNOWN");
    getters[screen]=getModel;
    const api=await registerRivalryLegacy();wrap(screen);
    return refresh(screen);
  }

  const RUNTIME_FILES=["visual-assets/v10_1/legacy/legacy.css", "visual-assets/v10_1/legacy/legacy.js", "visual-assets/v10_1/legacy/strings.json", "visual-assets/v10_1/legacy/assets/platemap.json", "visual-assets/v10_1/plates-v2/ENV_LEGACY_PHONE_V2.webp", "visual-assets/v10_1/legacy/assets/ENV_LG_PLATE_V1_1X.webp", "visual-assets/v10_1/legacy/assets/ENV_LG_PLATE_V1_2X.webp", "visual-assets/v10_1/legacy/assets/OVL_LG_DANIEL_FOREGROUND_V1_1X.webp", "visual-assets/v10_1/legacy/assets/OVL_LG_DANIEL_FOREGROUND_V1_2X.webp", "visual-assets/v10_1/legacy/assets/OVL_LG_DANIEL_FOREGROUND_V1_RIM_1X.webp", "visual-assets/v10_1/legacy/assets/OVL_LG_DANIEL_FOREGROUND_V1_RIM_2X.webp", "visual-assets/v10_1/legacy/assets/OVL_LG_NIK_FOREGROUND_V1_1X.webp", "visual-assets/v10_1/legacy/assets/OVL_LG_NIK_FOREGROUND_V1_2X.webp", "visual-assets/v10_1/legacy/assets/OVL_LG_NIK_FOREGROUND_V1_RIM_1X.webp", "visual-assets/v10_1/legacy/assets/OVL_LG_NIK_FOREGROUND_V1_RIM_2X.webp", "visual-assets/v10_1/legacy/assets/TITLE_LG_V1.webp", "visual-assets/v10_1/rivalry-statistics/rivalry-statistics.css", "visual-assets/v10_1/rivalry-statistics/rivalry-statistics.js", "visual-assets/v10_1/rivalry-statistics/strings.json", "visual-assets/v10_1/rivalry-statistics/assets/platemap.json", "visual-assets/v10_1/rivalry-statistics/assets/ENV_RV_PHONE_V1.webp", "visual-assets/v10_1/rivalry-statistics/assets/ENV_RV_PLATE_V1_1X.webp", "visual-assets/v10_1/rivalry-statistics/assets/ENV_RV_PLATE_V1_2X.webp", "visual-assets/v10_1/rivalry-statistics/assets/OVL_RV_DANIEL_PHONE_V1.webp", "visual-assets/v10_1/rivalry-statistics/assets/OVL_RV_DANIEL_POINT_V1_1X.webp", "visual-assets/v10_1/rivalry-statistics/assets/OVL_RV_DANIEL_POINT_V1_2X.webp", "visual-assets/v10_1/rivalry-statistics/assets/OVL_RV_DANIEL_POINT_V1_RIM_1X.webp", "visual-assets/v10_1/rivalry-statistics/assets/OVL_RV_DANIEL_POINT_V1_RIM_2X.webp", "visual-assets/v10_1/rivalry-statistics/assets/OVL_RV_NIK_ARMS_V1_1X.webp", "visual-assets/v10_1/rivalry-statistics/assets/OVL_RV_NIK_ARMS_V1_2X.webp", "visual-assets/v10_1/rivalry-statistics/assets/OVL_RV_NIK_ARMS_V1_RIM_1X.webp", "visual-assets/v10_1/rivalry-statistics/assets/OVL_RV_NIK_ARMS_V1_RIM_2X.webp", "visual-assets/v10_1/rivalry-statistics/assets/OVL_RV_NIK_PHONE_V1.webp", "visual-assets/v10_1/rivalry-statistics/assets/TITLE_RV_V1.webp", "visual-assets/v10_1/rivalry-statistics/assets/TITLE_RV_V1_PHONE.webp", "js/rivalryLegacyV10.js", "js/rivalryLegacyV10Markup.js", "css/rivalryLegacyV10.css"];
  return rlFreeze({toV10Frame:rlToV10Frame,mount:rlMount,markup,loadCareerModel:rlLoadCareerModel,cachedCareerModel:rlCachedCareerModel,RUNTIME_FILES});
});

