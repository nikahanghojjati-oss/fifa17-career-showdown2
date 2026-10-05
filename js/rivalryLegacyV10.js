(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeRivalryLegacyV10=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";
  // JOB-28: pure, read-only frames for Team V's current rivalry and completed History.
  const node=typeof module!=="undefined"&&module.exports;
  const seam=()=>node?require("./careerScreenSeam.js"):root.CareerModeCareerScreenSeam;
  const BASE="visual-assets/v10_1/",ORDER=["daniel","nik"],STATES=["loading","empty","unavailable","partial","ready"];
  const FIELDS=["seasonWins","seasonDraws","seasonLosses","championsLeagues","leagueTitles","domesticCups","totalTrophies","hundredPointSeasons","hundredGoalSeasons","topScorerSeasons","topAssistSeasons","perfectSeasons","bestSeasonScore"];
  const finite=x=>typeof x==="number"&&Number.isFinite(x);
  const pair=x=>x&&ORDER.every(k=>finite(x[k]));
  const copy=x=>JSON.parse(JSON.stringify(x));
  function rlFreeze(x){if(x&&typeof x==="object"&&!Object.isFrozen(x)){Object.values(x).forEach(rlFreeze);Object.freeze(x);}return x;}
  function bare(status){return {status,managerOrder:ORDER.slice()};}
  function validSeason(s){return s&&Number.isInteger(s.season)&&["daniel","nik","draw"].includes(s.winner)&&["score","leaguePosition","leaguePoints","leagueGoals"].every(k=>pair(s[k]));}
  function validRow(r){return r&&Number.isInteger(r.number)&&typeof r.leagueId==="string"&&r.clubs&&ORDER.every(k=>typeof r.clubs[k]==="string")&&finite(r.seasonsPlayed)&&finite(r.totalSeasons)&&pair(r.totals)&&["daniel","nik","draw"].includes(r.winner)&&Array.isArray(r.seasons)&&r.seasons.every(validSeason);}
  function historyFrame(model){
    const status=seam().careerScreenView("legacy",model).status;
    if(status==="loading"||status==="unavailable")return bare(status);
    const rows=model?.history?.showdowns;
    if(!Array.isArray(rows))return bare("unavailable");
    const completed=rows.filter(r=>r.status==="completed");
    if(!completed.every(validRow))return bare("unavailable");
    const frame={...bare(status==="ready"&&!completed.length?"empty":status),showdowns:completed.map(r=>({number:r.number,status:"completed",leagueId:r.leagueId,clubs:copy(r.clubs),seasonsPlayed:r.seasonsPlayed,totalSeasons:r.totalSeasons,totals:copy(r.totals),winner:r.winner,seasons:copy(r.seasons)})),ui:{page:1,pageSize:4,selectedShowdown:completed[0]?.number??null}};
    if(status==="partial")frame.coverage=copy(model.coverage);
    // Current-only projections are never offered as an archive or backfilled.
    if(model.interimLabel){frame.status="unavailable";return bare("unavailable");}
    return frame;
  }
  function rivalryFrame(model){
    let status,source,lifecycle=null;
    if(model?.history){
      status=seam().careerScreenView("rivalryStatistics",model).status;
      if(status==="loading"||status==="unavailable")return bare(status);
      const row=model.history.showdowns[0];
      if(!row||["abandoned","unavailable"].includes(row.status))return bare(status==="empty"?"empty":"unavailable");
      source={status,leagueId:row.leagueId,clubs:row.clubs,score:row.totals,totalSeasons:row.totalSeasons,seasons:row.seasons,managers:model.managers};lifecycle=row.status;
    }else{source=model;status=STATES.includes(source?.status)?source.status:"unavailable";lifecycle=source?.lifecycle??null;}
    if(status==="loading"||status==="unavailable")return bare(status);
    if(status==="empty"&&!source.managers)return {...bare("empty"),seasons:[],transfers:{status:"unavailable"}};
    if(!source.managers||!ORDER.every(k=>source.managers[k]&&FIELDS.every(f=>finite(source.managers[k][f])||(f==="bestSeasonScore"&&source.managers[k][f]===null))))return bare("unavailable");
    if(!Array.isArray(source.seasons)||!source.seasons.every(validSeason))return bare("unavailable");
    if(status!=="empty"&&(!pair(source.score)||!finite(source.totalSeasons)||!source.clubs||!ORDER.every(k=>typeof source.clubs[k]==="string")))return bare("unavailable");
    const frame={...bare(status),leagueId:source.leagueId??null,clubs:source.clubs?{daniel:source.clubs.daniel,nik:source.clubs.nik}:null,totalSeasons:source.totalSeasons??null,score:source.score?{daniel:source.score.daniel,nik:source.score.nik}:null,managerRecords:Object.fromEntries(ORDER.map(k=>[k,Object.fromEntries(FIELDS.map(f=>[f,source.managers[k][f]]))])),seasons:copy(source.seasons),transfers:{status:"unavailable"},ui:{lifecycle}};
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
  const sources={},getters={},resources={},originalMarkup={},tokens={};
  const LOADING=rlFreeze({status:"loading"}),UNAVAILABLE=rlFreeze({status:"unavailable"});
  let registration=null,installed=false;
  const screens=()=>root.CareerModeV10Screens;
  const state=name=>{try{return root[name]?.getState?.()??null;}catch(_){return null;}};
  const identity=()=>state("CareerModeOnlinePlayerIdentity");
  const context=()=>JSON.stringify([state("CareerModeSparkConnectedAccount")?.accountId??null,identity()?.managerId??null,state("CareerModePersistentNikDanielPair")?.rivalryId??null]);
  const report=error=>root.reportApplicationError?.("History and rivalry screens could not load",error);
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
      ["career-closed-loader","js/sparkClosedShowdownCareerLoader.js","CareerModeSparkClosedShowdownCareerLoader"]
    ])await load(key,file,global);
  }
  function rlSnapshot(){return {identity:identity(),pair:state("CareerModePersistentNikDanielPair"),history:state("CareerModeProductionSharedHistoryConvergence"),multiSeason:state("CareerModeProductionSharedMultiSeasonProgression"),finalReconciliation:state("CareerModeProductionSharedFinalReconciliation"),terminalClose:state("CareerModeProductionSharedTerminalClose")};}
  function markup(screen){if(node)require("./rivalryLegacyV10Markup.js");return root.CareerModeRivalryLegacyMarkup?.[screen]??"";}
  function source(screen){
    const model=getters[screen]?.();
    if(model!=null)return model;
    return seam().isOnlineCareerRoute(identity())?(sources[screen]??UNAVAILABLE):null;
  }
  function clean(screen){
    if(screen==="legacy"){root.LEGACY_BOOT?.cleanup?.();root.LegacyFixture?.stageController?.destroy?.();}
    else{root.rvStage?.destroy?.();root.rvStage=null;}
  }
  function draw(screen,model,host){
    clean(screen);
    // Job 13 retains hidden stages. Remove those before using the shared stage-root id.
    for(const id of ["careerStatistics","trophyRoom"]){const other=root.document.getElementById(id);if(other?.dataset.careerV10==="1"){screens().hide(id);other.remove();}}
    if(host.dataset.rivalryLegacyV10!=="1")originalMarkup[screen]=host.innerHTML;
    host.dataset.rivalryLegacyV10="1";host.innerHTML=markup(screen);
    // Team V's History frame has no Back control (the shared bar covers it), but the product keeps a .backButton for smart Back.
    if(screen==="legacy"){const layer=host.querySelector?.(".sd-stage__layer--ui"),back=layer&&root.document.createElement?.("button");if(back){back.id="legacyBack";back.type="button";back.className="backButton legacyBackV10 sd-btn sd-btn--secondary";back.innerHTML="<span class=\"legacyBackFull\">BACK TO MAIN MENU</span><span class=\"legacyBackShort\" aria-hidden=\"true\">BACK</span>";back.setAttribute("aria-label","Back to main menu");layer.appendChild(back);}}
    const frame=copy(rlToV10Frame(model,screen)),data={strings:resources[screen].strings,frames:{LIVE:frame}};
    if(screen==="legacy")root.LEGACY_BOOT={fixtures:data,platemap:resources[screen].map};
    else root.RIVALRY_BOOT={fixtures:data,platemap:resources[screen].map};
    root[BOOT[screen]]();
    const title=host.querySelector(screen==="legacy"?"#legacyHeading":"#statisticsScreenTitle");
    if(title){title.tabIndex=-1;title.setAttribute("data-route-focus-target","true");host.setAttribute("aria-labelledby",title.id);}
    if(screen==="rivalryStatistics"){
      const tabs=Array.from(host.querySelectorAll("[data-rv-tab]")),shell=host.querySelector("#rivalryStatisticsContent");
      const pick=(key,focus)=>{shell.setAttribute("data-tab",key);tabs.forEach(t=>{const on=t.dataset.rvTab===key;t.setAttribute("aria-selected",String(on));t.tabIndex=on?0:-1;if(on&&focus)t.focus();});};
      tabs.forEach((t,i)=>{t.addEventListener("click",()=>pick(t.dataset.rvTab));t.addEventListener("keydown",e=>{const d=e.key==="ArrowRight"?1:e.key==="ArrowLeft"?-1:0;if(d){e.preventDefault();pick(tabs[(i+d+tabs.length)%tabs.length].dataset.rvTab,true);}});});
    }
  }
  function undraw(screen,host){clean(screen);host.innerHTML=originalMarkup[screen]??"";delete host.dataset.rivalryLegacyV10;}
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
          prepare:async()=>{const responses=await Promise.all([root.fetch(BASE+base+"strings.json"),root.fetch(BASE+base+"assets/platemap.json")]);if(responses.some(r=>!r.ok))throw new Error("RIVALRY_LEGACY_RESOURCES_UNAVAILABLE");const [strings,map]=await Promise.all(responses.map(r=>r.json()));resources[screen]={strings,map};},
          frame:()=>source(screen),mount:(model,host)=>draw(screen,model,host),unmount:host=>undraw(screen,host)
        });
      }
      if(!installed){installed=true;for(const event of ["career-mode-online-identity-change","career-mode-connected-account-state-change","career-mode-shared-history-convergence-state-change","career-mode-shared-terminal-close-state-change"]){root.addEventListener?.(event,()=>{for(const screen of Object.keys(APP))if(screens().isMounted(APP[screen]))void refresh(screen).catch(report);});}}
      return api;
    })().catch(error=>{registration=null;throw error;});
    return registration;
  }
  async function refresh(screen){
    const key=context(),token=(tokens[screen]??0)+1;tokens[screen]=token;
    const supplied=getters[screen]?.();
    if(supplied!=null){screens().invalidate(APP[screen]);return screens().show(APP[screen]);}
    sources[screen]=LOADING;await screens().show(APP[screen]);
    try{
      await modelDependencies();
      const active=root.CareerModeSharedActiveShowdownAdapter.buildActiveShowdownViews(rlSnapshot());
      let model;
      if(screen==="rivalryStatistics")model={...active.rivalry,lifecycle:active.classification};
      else{
        const account=state("CareerModeSparkConnectedAccount"),runtime=root.CareerModeProductionFirebaseRuntime;
        if(!account?.connected||!runtime)model=UNAVAILABLE;
        else{
          const services=await runtime.ensureAccountServices(),user=services?.auth?.currentUser;
          if(!services?.ok||!user||user.uid!==account.accountId)model=UNAVAILABLE;
          else{
            // Reuse the configured SDK host and memory-only services. This only adds an exact-get
            // function to the reader argument; it changes no auth scope, provider setting or Rules.
            const sdk=services.firestoreSdk?.getDoc?services.firestoreSdk:await import(runtime.firebaseFirestoreModule);
            const result=await root.CareerModeSparkClosedShowdownCareerLoader.loadClosedShowdownCareer({firestore:services.firestore,firebaseSdk:{...services.firestoreSdk,getDoc:sdk.getDoc},user,current:active.careerInput});
            model=result.model??UNAVAILABLE;
          }
        }
      }
      if(tokens[screen]!==token||context()!==key)return false;
      sources[screen]=model;return screens().show(APP[screen]);
    }catch(error){if(tokens[screen]!==token||context()!==key)return false;sources[screen]=UNAVAILABLE;await screens().show(APP[screen]);report(error);return false;}
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

  const RUNTIME_FILES=["visual-assets/v10_1/legacy/legacy.css", "visual-assets/v10_1/legacy/legacy.js", "visual-assets/v10_1/legacy/strings.json", "visual-assets/v10_1/legacy/assets/platemap.json", "visual-assets/v10_1/legacy/assets/ENV_LG_PHONE_V1.webp", "visual-assets/v10_1/legacy/assets/ENV_LG_PLATE_V1_1X.webp", "visual-assets/v10_1/legacy/assets/ENV_LG_PLATE_V1_2X.webp", "visual-assets/v10_1/legacy/assets/OVL_LG_DANIEL_FOREGROUND_V1_1X.webp", "visual-assets/v10_1/legacy/assets/OVL_LG_DANIEL_FOREGROUND_V1_2X.webp", "visual-assets/v10_1/legacy/assets/OVL_LG_DANIEL_FOREGROUND_V1_RIM_1X.webp", "visual-assets/v10_1/legacy/assets/OVL_LG_DANIEL_FOREGROUND_V1_RIM_2X.webp", "visual-assets/v10_1/legacy/assets/OVL_LG_DANIEL_PHONE_V1.webp", "visual-assets/v10_1/legacy/assets/OVL_LG_NIK_FOREGROUND_V1_1X.webp", "visual-assets/v10_1/legacy/assets/OVL_LG_NIK_FOREGROUND_V1_2X.webp", "visual-assets/v10_1/legacy/assets/OVL_LG_NIK_FOREGROUND_V1_RIM_1X.webp", "visual-assets/v10_1/legacy/assets/OVL_LG_NIK_FOREGROUND_V1_RIM_2X.webp", "visual-assets/v10_1/legacy/assets/OVL_LG_NIK_PHONE_V1.webp", "visual-assets/v10_1/legacy/assets/TITLE_LG_V1.webp", "visual-assets/v10_1/rivalry-statistics/rivalry-statistics.css", "visual-assets/v10_1/rivalry-statistics/rivalry-statistics.js", "visual-assets/v10_1/rivalry-statistics/strings.json", "visual-assets/v10_1/rivalry-statistics/assets/platemap.json", "visual-assets/v10_1/rivalry-statistics/assets/ENV_RV_PHONE_V1.webp", "visual-assets/v10_1/rivalry-statistics/assets/ENV_RV_PLATE_V1_1X.webp", "visual-assets/v10_1/rivalry-statistics/assets/ENV_RV_PLATE_V1_2X.webp", "visual-assets/v10_1/rivalry-statistics/assets/OVL_RV_DANIEL_PHONE_V1.webp", "visual-assets/v10_1/rivalry-statistics/assets/OVL_RV_DANIEL_POINT_V1_1X.webp", "visual-assets/v10_1/rivalry-statistics/assets/OVL_RV_DANIEL_POINT_V1_2X.webp", "visual-assets/v10_1/rivalry-statistics/assets/OVL_RV_DANIEL_POINT_V1_RIM_1X.webp", "visual-assets/v10_1/rivalry-statistics/assets/OVL_RV_DANIEL_POINT_V1_RIM_2X.webp", "visual-assets/v10_1/rivalry-statistics/assets/OVL_RV_NIK_ARMS_V1_1X.webp", "visual-assets/v10_1/rivalry-statistics/assets/OVL_RV_NIK_ARMS_V1_2X.webp", "visual-assets/v10_1/rivalry-statistics/assets/OVL_RV_NIK_ARMS_V1_RIM_1X.webp", "visual-assets/v10_1/rivalry-statistics/assets/OVL_RV_NIK_ARMS_V1_RIM_2X.webp", "visual-assets/v10_1/rivalry-statistics/assets/OVL_RV_NIK_PHONE_V1.webp", "visual-assets/v10_1/rivalry-statistics/assets/TITLE_RV_V1.webp", "visual-assets/v10_1/rivalry-statistics/assets/TITLE_RV_V1_PHONE.webp", "js/rivalryLegacyV10.js", "js/rivalryLegacyV10Markup.js", "css/rivalryLegacyV10.css"];
  return rlFreeze({toV10Frame:rlToV10Frame,mount:rlMount,markup,RUNTIME_FILES});
});
