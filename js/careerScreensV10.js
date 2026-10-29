(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeCareerScreensV10=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // JOB-13 (G-13 part 1): lazy binder for Team V's Career Statistics and Trophy Room screens
  // (visual-assets/v10_1, pinned f4da9a3f). It reads the real career model only, through the
  // careerScreenSeam status, and maps it to the frame shape Team V's renderers read. No writes.
  const v10Node=typeof module!=="undefined"&&module.exports;
  const v10Seam=()=>v10Node?require("./careerScreenSeam.js"):root.CareerModeCareerScreenSeam;
  const BASE="visual-assets/v10_1/";
  const MANAGERS=Object.freeze(["daniel","nik"]);
  const NAMES=Object.freeze({daniel:"Daniel",nik:"Nik"});
  const SCREEN_IDS=Object.freeze({careerStatistics:"careerStatistics",trophyRoom:"trophyRoom"});
  // Team V copy for the same states (their screen strings at f4da9a3f), without the preview chip label.
  const STRINGS=Object.freeze({
    careerStatistics:{heading:"CAREER STATISTICS",previewLabel:"",buttons:{rivalry:"CURRENT RIVALRY STATISTICS",trophyRoom:"OPEN TROPHY ROOM",back:"BACK TO MAIN MENU"},sections:{careerTable:"CAREER TABLE",managerComparison:"MANAGER COMPARISON",careerLeaders:"CAREER LEADERS"},headlineLabels:["COMPLETED SHOWDOWNS","SEASONS PLAYED","CAREER POINTS","TROPHIES WON"],comparisonRows:["LEAGUE TITLES","DOMESTIC CUPS","CHAMPIONS LEAGUE WINS","EUROPA LEAGUE WINS","Season Wins","Average League Points","Average League Goals"],leaderLabels:["MOST SEASON WINS","MOST TROPHIES","MOST CAREER POINTS","BEST SEASON SCORE"],careerTableHeaders:["#","Manager","Showdowns","Season W-D-L","Points","Trophies"],goldenShowdown:"GOLDEN SHOWDOWN",noCompletedRecord:"No completed record yet",coverageTemplate:"{READABLE} of {INDEXED} Showdowns readable",stateCopy:{loading:{heading:"LOADING CAREER HISTORY",body:"Loading career history…"},partial:{heading:"PARTIAL CAREER HISTORY",body:"Some Showdowns could not be read. Statistics below use readable Showdowns only."},unavailable:{heading:"CAREER HISTORY UNAVAILABLE",body:"Career history could not be loaded. No statistics are being shown."}}},
    trophyRoom:{heading:"TROPHY ROOM",back:"BACK",previewLabel:"",managerCabinetsHeading:"MANAGER CABINETS",careerTableHeading:"CAREER TABLE",recordsReadyHeading:"ALL-TIME RECORDS",categories:["ALL","SHOWDOWN","LEAGUE TITLES","DOMESTIC CUPS","CHAMPIONS LEAGUE","EUROPA LEAGUE"],trophyTypes:{showdown:"Showdown Champion",goldenShowdown:"Golden Showdown",leagueTitles:"League Title",domesticCups:"Domestic Cup",championsLeague:"Champions League",europaLeague:"Europa League"},notWonYet:"Not won yet",stateCopy:{loading:{text:"Loading career history…"},partial:{text:"Some Showdowns could not be read. Showing {READABLE} of {INDEXED} Showdowns."},partialRecordsHeading:{text:"AVAILABLE RECORDS"},unavailable:{text:"Career history is unavailable right now."}}}
  });
  const CS_FIELDS=["careerPoints","seasons","seasonWins","seasonDraws","seasonLosses","championsLeagues","europaLeagues","leagueTitles","domesticCups","totalTrophies","bestSeasonScore","averageLeaguePoints","averageLeagueGoals"];
  const SHOWDOWN_FIELDS=["completed","wins","draws","losses"];
  const CABINET_FIELDS=["championsLeagues","europaLeagues","leagueTitles","domesticCups","totalTrophies"];

  function v10Freeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(v10Freeze);Object.freeze(value);}return value;}
  const v10Finite=value=>typeof value==="number"&&Number.isFinite(value);
  function v10Pick(record,fields){
    if(!record||typeof record!=="object")return null;
    const out={};
    for(const key of fields){if(!v10Finite(record[key]))return null;out[key]=record[key];}
    return out;
  }
  // Daniel first, Nik second, whoever leads. A level table ranks both first.
  function v10Ranks(standings){
    return MANAGERS.map(manager=>{
      const index=standings.findIndex(row=>row&&row.manager===manager);
      return {manager,rank:index<0?null:standings[index].level===true?1:index+1};
    });
  }
  // r84 Golden Showdown: how many finished 10-season Showdowns each manager closed on 110 points, counted from the completed
  // rows this model already holds (the seam owns the rule). Only a career with one carries the field.
  function v10GoldenShowdowns(model,frame){
    const counts=v10Seam().goldenShowdownCounts(model.history&&model.history.showdowns);
    if(counts.daniel>0||counts.nik>0)frame.goldenShowdowns=counts;
  }
  // r86 Special Player chip (js/specialPlayerChip.js): the live Showdown's Special Players, else the most recently confirmed
  // Showdown's in this career. A career with no r86 Showdown carries no field (no chip).
  const v10Chip=()=>v10Node?require("./specialPlayerChip.js"):root.CareerModeSpecialPlayerChip;
  function v10SpecialPlayers(model,frame){
    let sp=null;try{sp=v10Chip()?.latest?.(model.history&&model.history.showdowns)??null;}catch(_){sp=null;}
    if(sp)frame.specialPlayers={daniel:sp.daniel,nik:sp.nik};
  }
  function v10CareerStatistics(model,status){
    const managers={},showdowns={};
    for(const manager of MANAGERS){
      // JOB-1028 (H1019-5): an abandoned-only career has no best season or averages yet; show 0 like the old Statistics screen.
      const csRecord=model.managers[manager]&&{...model.managers[manager]};
      if(csRecord)for(const key of ["bestSeasonScore","averageLeaguePoints","averageLeagueGoals"])if(csRecord[key]===null)csRecord[key]=0;
      managers[manager]=v10Pick(csRecord,CS_FIELDS);
      showdowns[manager]=v10Pick(model.managers[manager].showdowns,SHOWDOWN_FIELDS);
      if(!managers[manager]||!showdowns[manager])return null;
    }
    const ranks=v10Ranks(model.trophyRoom.standings);
    if(ranks.some(row=>row.rank===null))return null;
    const frame={status,managerOrder:MANAGERS.slice(),managers,showdowns,expectedCareerTableRows:ranks};
    if(status==="partial")frame.coverage={readable:model.coverage.readable,indexed:model.coverage.indexed};
    v10GoldenShowdowns(model,frame);v10SpecialPlayers(model,frame);
    return frame;
  }
  function v10TrophyRoom(model,status){
    const managers={},showdowns={},room=model.trophyRoom;
    for(const manager of MANAGERS){
      const cabinet=v10Pick(room.cabinet[manager],CABINET_FIELDS),career=v10Pick(model.managers[manager],["careerPoints","seasonWins"]),wins=model.managers[manager].showdowns&&model.managers[manager].showdowns.wins;
      if(!cabinet||!career||!v10Finite(wins))return null;
      managers[manager]={displayName:NAMES[manager],...cabinet,...career};
      showdowns[manager]={wins};
    }
    const ranks=v10Ranks(room.standings);
    if(ranks.some(row=>row.rank===null))return null;
    const standings=ranks.map(({manager,rank})=>({manager,careerPoints:managers[manager].careerPoints,seasonWins:managers[manager].seasonWins,rank:"#"+rank}));
    const records=room.records.filter(row=>v10Finite(row.value)).map(row=>({label:String(row.label).toUpperCase(),manager:row.manager,value:row.value}));
    const frame={status,activeCategory:"ALL",managerOrder:MANAGERS.slice(),managers,standings,records,showdowns};
    if(status==="partial")frame.coverage={readable:model.coverage.readable,indexed:model.coverage.indexed};
    v10GoldenShowdowns(model,frame);v10SpecialPlayers(model,frame);
    return frame;
  }
  // Pure: model + screen -> the frame Team V's renderer reads. loading and unavailable carry no numbers.
  function toV10Frame(model,screen){
    if(!Object.prototype.hasOwnProperty.call(SCREEN_IDS,screen))throw new TypeError("CAREER_SCREEN_V10_UNKNOWN");
    const view=v10Seam().careerScreenView(screen,model);
    const bare=status=>{const frame={status,managerOrder:MANAGERS.slice()};if(screen==="trophyRoom")frame.activeCategory="ALL";return frame;};
    let frame=null;
    if(view.status==="ready"||view.status==="partial"){
      frame=screen==="careerStatistics"?v10CareerStatistics(model,view.status):v10TrophyRoom(model,view.status);
      if(!frame)frame=bare("unavailable");
    }else if(view.status==="empty"&&screen==="trophyRoom"){
      frame=v10TrophyRoom(model,"empty")||bare("empty");
      frame.records=[];
    }else frame=bare(view.status);
    if(view.interimLabel&&frame.status!=="unavailable")frame.previewLabel=view.interimLabel;
    return v10Freeze(frame);
  }

  // ---- Browser binding (lazy; never runs in Node) ----
  // JOB-24: both screens are registered with the shared loader js/v10Screens.js, which loads the kit and
  // these files once, switches Team V's styles with the screen and mounts/unmounts on screen changes.
  // What the screens draw is unchanged.
  const FILES=Object.freeze({
    styles:["shared/showdown-tokens.css","shared/showdown-type.css","shared/showdown-ui.css","shared/stage.css","shared/motion.css"],
    scripts:[["career-v10-stage","shared/stage.js",()=>Boolean(root.ShowdownStage)],["career-v10-motion","shared/motion.js",()=>typeof root.sdEnter==="function"]],
    careerStatistics:{style:"career-statistics/career-statistics.css",script:["career-v10-career-statistics","career-statistics/career-statistics.js",()=>typeof root.ShowdownCareerStatisticsBoot==="function"],platemap:"career-statistics/assets/platemap.json"},
    trophyRoom:{style:"trophy-room/trophy-room.css",script:["career-v10-trophy-room","trophy-room/trophy-room.js",()=>typeof root.ShowdownTrophyRoomBoot==="function"],platemap:"trophy-room/assets/platemap.json"}
  });
  const getters={careerStatistics:null,trophyRoom:null};
  const platemaps={};
  // Online with no readable model: one fixed frame, drawn as Team V's unavailable state.
  const UNAVAILABLE=Object.freeze({careerScreenV10:"unavailable"});
  const LOADING=Object.freeze({status:"loading"});
  let registered=null,onlineLoading=false,onlineToken=0;
  const onlineLifetimes={careerStatistics:0,trophyRoom:0};
  const v10Screens=()=>root.CareerModeV10Screens;
  // The Special Player draw loads with the screen's own files (never rejects: a chip that cannot load is not drawn).
  function v10EnsureChip(){return Promise.resolve().then(()=>root.loadRuntimeScript("special-player-chip","js/specialPlayerChip.js",()=>Boolean(root.CareerModeSpecialPlayerChip))).then(()=>root.CareerModeSpecialPlayerChip.ensure()).catch(()=>false);}
  function v10Fail(error){if(typeof root.reportApplicationError==="function")root.reportApplicationError("Career screens could not load",error);}

  const TROPHY_SMALL_PHONE_CSS=String.raw`
/* JOB-1322: a single vertical 360x640 Trophy Room reading surface.
   Do not change Team V's frozen CSS or the 390x844 / desktop compositions. */
@media (max-width:374px) and (max-height:700px) and (orientation:portrait) {
  #trophyRoom.careerScreenV10 {
    height:100dvh; max-height:100dvh; overflow-x:hidden; overflow-y:auto;
    overscroll-behavior-y:contain; -webkit-overflow-scrolling:touch;
  }
  #trophyRoom .trophyRoomScene {
    position:relative; height:auto!important; min-height:100dvh!important;
    overflow:visible!important;
  }
  #trophyRoom .sd-stage[data-sd-mode="phone"] .sd-stage__layer--ui {
    position:relative!important; inset:auto!important; height:auto!important;
    min-height:100dvh!important; overflow:visible!important;
  }
  #trophyRoom .sd-stage[data-sd-mode="phone"] .sd-stage__ui-content {
    height:auto!important;
  }
  #trophyRoom .trophyPhoneArt {height:265px; bottom:auto}
  #trophyRoom .trophyPhoneHero--daniel {top:20px; height:215px}
  #trophyRoom .trophyPhoneHero--nik {top:18px; height:215px}
  #trophyRoom .trophyRoomContent {
    display:flex; flex-direction:column; box-sizing:border-box;
    height:auto!important; min-height:100dvh; overflow:visible!important;
    padding:253px 0 calc(132px + env(safe-area-inset-bottom));
    background:linear-gradient(180deg,transparent 0,rgba(2,3,4,.25) 170px,#050607 285px);
  }
  #trophyRoom .trophyTitleBlock {top:12px; left:27%; width:46%}
  #trophyRoom .heroCeremony {top:122px; left:34%; width:32%; height:121px}
  #trophyRoom .heroPlinth {min-height:42px}
  #trophyRoom .trophyShelf {
    position:relative; inset:auto; order:2; width:auto; height:auto;
    min-height:0; margin:0 10px;
  }
  #trophyRoom .trophyTabs {
    position:relative; inset:auto; width:100%; height:auto;
    display:grid; grid-template-columns:repeat(2,minmax(0,1fr));
    gap:7px; padding:0 0 10px; overflow:visible; scroll-snap-type:none;
  }
  #trophyRoom .trophyTab {
    width:100%; min-width:0; min-height:44px; height:auto;
    padding:7px 8px; white-space:normal; overflow-wrap:anywhere; line-height:1.2;
  }
  #trophyRoom .shelfGlass {
    position:relative; inset:auto; min-height:0; overflow:visible;
    clip-path:none; padding:12px 10px 14px;
  }
  #trophyRoom .trophyGrid,
  #trophyRoom .trophyShelf.is-filtered .trophyGrid {
    position:relative; inset:auto; display:grid;
    grid-template-columns:repeat(2,minmax(0,1fr));
    gap:10px; padding:0; overflow:visible;
    scroll-snap-type:none; scroll-padding:0;
  }
  #trophyRoom .trophyShelf.is-filtered .trophyGrid {
    grid-template-columns:minmax(0,220px); justify-content:center;
  }
  #trophyRoom .trophyCard {
    flex:none; width:auto; height:auto; min-height:164px;
    padding:8px 7px; overflow:visible; scroll-snap-align:none;
  }
  #trophyRoom .trophyCardPicture {height:88px}
  #trophyRoom .trophyCard h3 {
    white-space:normal; overflow-wrap:anywhere; line-height:1.18;
    min-height:26px; margin:4px 0 5px;
  }
  #trophyRoom .managerCounts {gap:5px}
  #trophyRoom .managerCounts span {overflow-wrap:anywhere}
  #trophyRoom .notWonYet {position:relative; bottom:auto; margin:6px 0 0}
  #trophyRoom .stateNotice {
    position:relative; inset:auto; min-height:44px; height:auto;
    margin-bottom:10px;
  }
  #trophyRoom .statePanel {
    position:relative; inset:auto; min-height:160px; padding:16px;
  }
  #trophyRoom .fatalState {
    position:relative; inset:auto; margin:12px; padding:16px;
  }
  #trophyRoom .trophyPhoneSheet.sd-sheet {display:none!important}
  #trophyRoom .trophyBack {
    position:fixed; left:12px; right:100px; bottom:calc(64px + env(safe-area-inset-bottom));
    width:auto; height:44px;
  }
  #trophyRoom .trophyPhoneMoreButton {
    position:fixed; right:12px; bottom:calc(64px + env(safe-area-inset-bottom));
    width:78px; min-height:44px;
  }
  #trophyRoom .phoneMoreToggle {
    position:fixed!important; right:12px!important;
    bottom:calc(64px + env(safe-area-inset-bottom))!important;
    width:78px!important; height:44px!important;
  }
  #trophyRoom .trophyPhoneNavReserve {
    position:fixed; bottom:0; height:calc(56px + env(safe-area-inset-bottom));
  }
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .careerRanks {
    position:relative; inset:auto; order:1; display:grid; height:auto;
    grid-template-columns:repeat(2,minmax(0,1fr));
    gap:8px; margin:0 12px 12px; pointer-events:none;
  }
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .careerRank {
    position:relative; inset:auto!important; height:auto; min-height:92px;
    width:auto; min-width:0; padding:9px 7px;
  }
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .careerRank small {
    white-space:normal; overflow:visible; text-overflow:clip; line-height:1.3;
  }
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .trophyTabs,
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .trophyGrid {
    display:none; 
  }
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .shelfGlass {
    visibility:visible;
  }
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .recordRibbon {
    position:relative; inset:auto; display:grid; visibility:visible;
    width:auto; height:auto; grid-template-columns:repeat(2,minmax(0,1fr));
    gap:7px; padding:9px 0; overflow:visible;
  }
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .recordRibbonHeading {
    grid-column:1/-1; min-height:36px; padding:8px;
  }
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .recordItem {
    min-width:0; min-height:60px; padding:8px;
    border:1px solid rgba(217,174,83,.15);
  }
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .recordItem small {
    white-space:normal; overflow:visible; text-overflow:clip;
    overflow-wrap:anywhere; font-size:10px; line-height:1.3;
  }
}`;

  const TROPHY_390_PHONE_CSS=String.raw`
/* JOB-1323: 390x844-class portrait phones use one document-level reading surface.
   All changes stay in the adapter; Team V's design CSS is frozen. */
@media (min-width:375px) and (max-width:414px) and (min-height:701px) and (max-height:900px) and (orientation:portrait) {
  #trophyRoom.careerScreenV10 {
    height:100dvh; max-height:100dvh; overflow-x:hidden; overflow-y:auto;
    overscroll-behavior-y:contain; -webkit-overflow-scrolling:touch;
  }
  #trophyRoom .trophyRoomScene {
    position:relative; height:auto!important; min-height:100dvh!important;
    overflow:visible!important;
  }
  #trophyRoom .sd-stage[data-sd-mode="phone"] .sd-stage__layer--ui {
    position:relative!important; inset:auto!important; height:auto!important;
    min-height:100dvh!important; overflow:visible!important;
  }
  #trophyRoom .sd-stage[data-sd-mode="phone"] .sd-stage__ui-content {
    height:auto!important;
  }
  #trophyRoom .trophyPhoneArt {height:295px; bottom:auto}
  #trophyRoom .trophyPhoneHero--daniel {top:22px; height:230px}
  #trophyRoom .trophyPhoneHero--nik {top:20px; height:230px}
  #trophyRoom .trophyRoomContent {
    display:flex; flex-direction:column; box-sizing:border-box;
    height:auto!important; min-height:100dvh; overflow:visible!important;
    padding:280px 0 calc(132px + env(safe-area-inset-bottom));
    background:linear-gradient(180deg,transparent 0,rgba(2,3,4,.25) 185px,#050607 300px);
  }
  #trophyRoom .trophyTitleBlock {top:14px; left:27%; width:46%}
  #trophyRoom .heroCeremony {top:131px; left:34%; width:32%; height:130px}
  #trophyRoom .heroPlinth {min-height:42px}
  #trophyRoom .trophyShelf {
    position:relative; inset:auto; order:2; width:auto; height:auto;
    min-height:0; margin:0 12px;
  }
  #trophyRoom .trophyTabs {
    position:relative; inset:auto; width:100%; height:auto;
    display:grid; grid-template-columns:repeat(2,minmax(0,1fr));
    gap:8px; padding:0 0 12px; overflow:visible; scroll-snap-type:none;
  }
  #trophyRoom .trophyTab {
    width:100%; min-width:0; min-height:44px; height:auto;
    padding:8px; white-space:normal; overflow-wrap:anywhere; line-height:1.2;
  }
  #trophyRoom .shelfGlass {
    position:relative; inset:auto; min-height:0; overflow:visible;
    clip-path:none; padding:12px 10px 14px;
  }
  #trophyRoom .trophyGrid,
  #trophyRoom .trophyShelf.is-filtered .trophyGrid {
    position:relative; inset:auto; display:grid;
    grid-template-columns:repeat(2,minmax(0,1fr));
    gap:10px; padding:0; overflow:visible;
    scroll-snap-type:none; scroll-padding:0;
  }
  #trophyRoom .trophyShelf.is-filtered .trophyGrid {
    grid-template-columns:minmax(0,230px); justify-content:center;
  }
  #trophyRoom .trophyCard {
    flex:none; width:auto; height:auto; min-height:184px;
    padding:8px 7px; overflow:visible; scroll-snap-align:none;
  }
  #trophyRoom .trophyCardPicture {height:92px}
  #trophyRoom .trophyCard h3 {
    white-space:normal; overflow-wrap:anywhere; line-height:1.2;
    min-height:26px; margin:4px 0 5px;
  }
  #trophyRoom .managerCounts {gap:5px}
  #trophyRoom .managerCounts span {overflow-wrap:anywhere}
  #trophyRoom .notWonYet {position:relative; bottom:auto; margin:6px 0 0}
  #trophyRoom .stateNotice {
    position:relative; inset:auto; min-height:44px; height:auto;
    margin-bottom:10px;
  }
  #trophyRoom .statePanel {
    position:relative; inset:auto; min-height:160px; padding:16px;
  }
  #trophyRoom .fatalState {
    position:relative; inset:auto; margin:12px; padding:16px;
  }
  #trophyRoom .trophyPhoneSheet.sd-sheet {display:none!important}
  #trophyRoom .trophyBack {
    position:fixed; left:12px; right:100px; bottom:calc(64px + env(safe-area-inset-bottom));
    width:auto; height:44px; min-height:44px;
  }
  #trophyRoom .trophyPhoneMoreButton {
    position:fixed; right:12px; bottom:calc(64px + env(safe-area-inset-bottom));
    width:78px; min-height:44px;
  }
  #trophyRoom .phoneMoreToggle {
    position:fixed!important; right:12px!important;
    bottom:calc(64px + env(safe-area-inset-bottom))!important;
    width:78px!important; height:44px!important;
  }
  #trophyRoom .trophyPhoneNavReserve {
    position:fixed; bottom:0; height:calc(56px + env(safe-area-inset-bottom));
  }
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .careerRanks {
    position:relative; inset:auto; order:1; display:grid; height:auto;
    grid-template-columns:repeat(2,minmax(0,1fr));
    gap:8px; margin:0 12px 12px; pointer-events:none;
  }
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .careerRank {
    position:relative; inset:auto!important; height:auto; min-height:92px;
    width:auto; min-width:0; padding:9px 7px;
  }
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .careerRank small {
    white-space:normal; overflow:visible; text-overflow:clip; line-height:1.3;
  }
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .trophyTabs,
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .trophyGrid {
    display:none;
  }
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .shelfGlass {
    visibility:visible;
  }
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .recordRibbon {
    position:relative; inset:auto; display:grid; visibility:visible;
    width:auto; height:auto; grid-template-columns:repeat(2,minmax(0,1fr));
    gap:8px; padding:9px 0; overflow:visible;
  }
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .recordRibbonHeading {
    grid-column:1/-1; min-height:36px; padding:8px;
  }
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .recordItem {
    min-width:0; min-height:60px; padding:8px;
    border:1px solid rgba(217,174,83,.15);
  }
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .recordItem small {
    white-space:normal; overflow:visible; text-overflow:clip;
    overflow-wrap:anywhere; font-size:10px; line-height:1.3;
  }
}
`;

  const TROPHY_430_PHONE_CSS=String.raw`
/* JOB-1324: 430x932-class portrait phones use one document-level reading surface.
   All changes stay in the adapter; Team V's design CSS is frozen. */
@media (min-width:415px) and (max-width:450px) and (min-height:901px) and (max-height:1000px) and (orientation:portrait) {
  #trophyRoom.careerScreenV10 {
    height:100dvh; max-height:100dvh; overflow-x:hidden; overflow-y:auto;
    overscroll-behavior-y:contain; -webkit-overflow-scrolling:touch;
  }
  #trophyRoom .trophyRoomScene {
    position:relative; height:auto!important; min-height:100dvh!important;
    overflow:visible!important;
  }
  #trophyRoom .sd-stage[data-sd-mode="phone"] .sd-stage__layer--ui {
    position:relative!important; inset:auto!important; height:auto!important;
    min-height:100dvh!important; overflow:visible!important;
  }
  #trophyRoom .sd-stage[data-sd-mode="phone"] .sd-stage__ui-content {
    height:auto!important;
  }
  #trophyRoom .trophyPhoneArt {height:320px; bottom:auto}
  #trophyRoom .trophyPhoneHero--daniel {top:22px; height:250px}
  #trophyRoom .trophyPhoneHero--nik {top:20px; height:250px}
  #trophyRoom .trophyRoomContent {
    display:flex; flex-direction:column; box-sizing:border-box;
    height:auto!important; min-height:100dvh; overflow:visible!important;
    padding:300px 0 calc(132px + env(safe-area-inset-bottom));
    background:linear-gradient(180deg,transparent 0,rgba(2,3,4,.25) 200px,#050607 325px);
  }
  #trophyRoom .trophyTitleBlock {top:14px; left:27%; width:46%}
  #trophyRoom .heroCeremony {top:143px; left:34%; width:32%; height:140px}
  #trophyRoom .heroPlinth {min-height:42px}
  #trophyRoom .trophyShelf {
    position:relative; inset:auto; order:2; width:auto; height:auto;
    min-height:0; margin:0 12px;
  }
  #trophyRoom .trophyTabs {
    position:relative; inset:auto; width:100%; height:auto;
    display:grid; grid-template-columns:repeat(2,minmax(0,1fr));
    gap:8px; padding:0 0 12px; overflow:visible; scroll-snap-type:none;
  }
  #trophyRoom .trophyTab {
    width:100%; min-width:0; min-height:44px; height:auto;
    padding:8px; white-space:normal; overflow-wrap:anywhere; line-height:1.2;
  }
  #trophyRoom .shelfGlass {
    position:relative; inset:auto; min-height:0; overflow:visible;
    clip-path:none; padding:12px 10px 14px;
  }
  #trophyRoom .trophyGrid,
  #trophyRoom .trophyShelf.is-filtered .trophyGrid {
    position:relative; inset:auto; display:grid;
    grid-template-columns:repeat(2,minmax(0,1fr));
    gap:10px; padding:0; overflow:visible;
    scroll-snap-type:none; scroll-padding:0;
  }
  #trophyRoom .trophyShelf.is-filtered .trophyGrid {
    grid-template-columns:minmax(0,250px); justify-content:center;
  }
  #trophyRoom .trophyCard {
    flex:none; width:auto; height:auto; min-height:194px;
    padding:8px 7px; overflow:visible; scroll-snap-align:none;
  }
  #trophyRoom .trophyCardPicture {height:102px}
  #trophyRoom .trophyCard h3 {
    white-space:normal; overflow-wrap:anywhere; line-height:1.2;
    min-height:26px; margin:4px 0 5px;
  }
  #trophyRoom .managerCounts {gap:5px}
  #trophyRoom .managerCounts span {overflow-wrap:anywhere}
  #trophyRoom .notWonYet {position:relative; bottom:auto; margin:6px 0 0}
  #trophyRoom .stateNotice {
    position:relative; inset:auto; min-height:44px; height:auto;
    margin-bottom:10px;
  }
  #trophyRoom .statePanel {
    position:relative; inset:auto; min-height:160px; padding:16px;
  }
  #trophyRoom .fatalState {
    position:relative; inset:auto; margin:12px; padding:16px;
  }
  #trophyRoom .trophyPhoneSheet.sd-sheet {display:none!important}
  #trophyRoom .trophyBack {
    position:fixed; left:12px; right:100px; bottom:calc(64px + env(safe-area-inset-bottom));
    width:auto; height:44px; min-height:44px;
  }
  #trophyRoom .trophyPhoneMoreButton {
    position:fixed; right:12px; bottom:calc(64px + env(safe-area-inset-bottom));
    width:78px; min-height:44px;
  }
  #trophyRoom .phoneMoreToggle {
    position:fixed!important; right:12px!important;
    bottom:calc(64px + env(safe-area-inset-bottom))!important;
    width:78px!important; height:44px!important;
  }
  #trophyRoom .trophyPhoneNavReserve {
    position:fixed; bottom:0; height:calc(56px + env(safe-area-inset-bottom));
  }
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .careerRanks {
    position:relative; inset:auto; order:1; display:grid; height:auto;
    grid-template-columns:repeat(2,minmax(0,1fr));
    gap:8px; margin:0 12px 12px; pointer-events:none;
  }
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .careerRank {
    position:relative; inset:auto!important; height:auto; min-height:92px;
    width:auto; min-width:0; padding:9px 7px;
  }
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .careerRank small {
    white-space:normal; overflow:visible; text-overflow:clip; line-height:1.3;
  }
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .trophyTabs,
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .trophyGrid {
    display:none;
  }
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .shelfGlass {
    visibility:visible;
  }
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .recordRibbon {
    position:relative; inset:auto; display:grid; visibility:visible;
    width:auto; height:auto; grid-template-columns:repeat(2,minmax(0,1fr));
    gap:8px; padding:9px 0; overflow:visible;
  }
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .recordRibbonHeading {
    grid-column:1/-1; min-height:36px; padding:8px;
  }
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .recordItem {
    min-width:0; min-height:60px; padding:8px;
    border:1px solid rgba(217,174,83,.15);
  }
  #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .recordItem small {
    white-space:normal; overflow:visible; text-overflow:clip;
    overflow-wrap:anywhere; font-size:10px; line-height:1.3;
  }
}
`;

  const TROPHY_844_LANDSCAPE_CSS=String.raw`
/* JOB-1325: short 844x390-class landscape phones get one vertical reading surface. */
@media (min-width:761px) and (max-width:900px) and (min-height:350px) and (max-height:430px) and (orientation:landscape) {
  #trophyRoom.careerScreenV10 {
    height:100dvh; max-height:100dvh; overflow-x:hidden; overflow-y:auto;
    overscroll-behavior-y:contain; -webkit-overflow-scrolling:touch;
  }
  #trophyRoom .trophyRoomScene {
    position:relative; height:auto!important; min-height:100dvh!important;
    overflow:visible!important;
  }
  #trophyRoom .sd-stage__layer--ui {
    position:relative!important; inset:auto!important; height:auto!important;
    min-height:100dvh!important; overflow:visible!important;
  }
  #trophyRoom .trophyRoomContent.sd-stage__ui-content {
    display:flex; flex-direction:column; align-items:stretch;
    box-sizing:border-box; height:auto!important; min-height:100dvh;
    overflow:visible!important;
    padding:64px max(16px,env(safe-area-inset-left)) calc(84px + env(safe-area-inset-bottom)) max(16px,env(safe-area-inset-right));
    background:linear-gradient(180deg,rgba(2,3,4,.35),#050607 330px);
  }
  #trophyRoom .previewPill {position:relative; inset:auto; align-self:center; margin-bottom:8px}
  #trophyRoom .trophyTitleBlock {
    position:relative; inset:auto; width:min(100%,320px); height:auto;
    align-self:center; margin-bottom:12px;
  }
  #trophyRoom .trophyBrushTitle {width:100%; height:auto; flex:none}
  #trophyRoom .heroCeremony {
    position:relative; inset:auto; width:220px; height:160px;
    align-self:center; margin:0 0 16px; order:1;
  }
  #trophyRoom .heroPlinth {min-height:44px}
  #trophyRoom .careerRanks {
    position:relative; inset:auto; width:100%; height:auto; order:2;
    display:grid; grid-template-columns:repeat(2,minmax(0,1fr));
    gap:12px; margin:0 0 16px;
  }
  #trophyRoom .careerRank {
    position:relative; inset:auto; width:auto; min-width:0; height:auto;
    padding:10px; text-align:center;
  }
  #trophyRoom .careerRank small {white-space:normal; overflow-wrap:anywhere; line-height:1.3}
  #trophyRoom .trophyShelf {
    position:relative; inset:auto; width:100%; height:auto; min-height:0; order:3;
  }
  #trophyRoom .trophyTabs {
    position:relative; inset:auto; width:100%; height:auto;
    display:grid; grid-template-columns:repeat(6,minmax(0,1fr));
    gap:4px; margin-bottom:8px; overflow:visible;
  }
  #trophyRoom .trophyTab {
    min-width:0; min-height:44px; height:auto; padding:8px;
    white-space:normal; overflow-wrap:anywhere; line-height:1.2;
  }
  #trophyRoom .shelfGlass {
    position:relative; inset:auto; clip-path:none; overflow:visible; padding:12px;
  }
  #trophyRoom .trophyGrid,
  #trophyRoom .trophyShelf.is-filtered .trophyGrid {
    position:relative; inset:auto; display:grid; overflow:visible;
    grid-template-columns:repeat(5,minmax(0,1fr)); gap:10px;
  }
  #trophyRoom .trophyShelf.is-filtered .trophyGrid {
    grid-template-columns:minmax(0,260px); justify-content:center;
  }
  #trophyRoom .trophyCard {height:auto; min-height:194px; overflow:visible; padding:8px}
  #trophyRoom .trophyCardPicture {height:102px}
  #trophyRoom .trophyCard h3 {
    white-space:normal; overflow-wrap:anywhere; line-height:1.2;
    min-height:26px; margin:4px 0 5px;
  }
  #trophyRoom .managerCounts span {overflow-wrap:anywhere}
  #trophyRoom .notWonYet {position:relative; bottom:auto; margin:6px 0 0}
  #trophyRoom .recordRibbon {
    position:relative; inset:auto; height:auto; margin-top:12px;
    grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; overflow:visible;
  }
  #trophyRoom .recordRibbonHeading {grid-column:1/-1; min-height:36px; padding:8px}
  #trophyRoom .recordItem {min-width:0; min-height:60px; padding:8px}
  #trophyRoom .recordItem small {
    white-space:normal; overflow:visible; text-overflow:clip;
    overflow-wrap:anywhere; font-size:10px; line-height:1.3;
  }
  #trophyRoom .stateNotice {
    position:relative; inset:auto; height:auto; min-height:44px;
    padding:8px; margin-bottom:12px; flex-wrap:wrap;
  }
  #trophyRoom .statePanel {position:relative; inset:auto; min-height:160px; padding:16px}
  #trophyRoom .fatalState {position:relative; inset:auto; padding:16px}
  #trophyRoom .trophyBack {
    position:fixed; left:calc(50% - 140px); right:auto;
    bottom:calc(16px + env(safe-area-inset-bottom)); width:280px;
    height:44px; min-height:44px; z-index:40;
  }
}
`;

  // JOB-1326: reuse the short-landscape layout only for 932x430-class phones.
  const TROPHY_932_LANDSCAPE_CSS=TROPHY_844_LANDSCAPE_CSS.replace(
    "(min-width:761px) and (max-width:900px) and (min-height:350px) and (max-height:430px)",
    "(min-width:901px) and (max-width:1000px) and (min-height:391px) and (max-height:470px)"
  );


  // JOB-1655: at these laptop, Chromebook and ultrawide sizes Team V's stage
  // keeps its own absolute layout, so the whole room including BACK stays in
  // one view and #trophyRoom is never a scroller (main is the only scroller).
  // Only the category tabs change: one ROW, 44px high. The first attempt
  // rebuilt the stage as a flow layout, and analytics.css's old
  // `.trophyShelf{display:grid}` then dropped the tabs into grid cells.
  const TROPHY_1280_LAPTOP_CSS=String.raw`
@media (min-width:1200px) and (max-width:1365px) and (min-height:600px) and (max-height:700px) {
  #trophyRoom .trophyTabs {top:-44px; height:44px}
  #trophyRoom .trophyTab {min-height:44px; line-height:1.15}
  #trophyRoom .careerRanks {top:48.5%}
}
`;

  const TROPHY_1366_CHROMEBOOK_CSS=String.raw`
@media (min-width:1366px) and (max-width:1440px) and (min-height:720px) and (max-height:820px) {
  #trophyRoom .trophyTabs {top:-44px; height:44px}
  #trophyRoom .trophyTab {min-height:44px; line-height:1.15}
}
`;

  // JOB-1330: full-HD desktop category targets are 35px high in Team V's
  // frozen sheet. Give the tabs a 44px hit area without covering the shelf,
  // and allow dynamic cabinet labels to wrap rather than overlap or clip.
  const TROPHY_1920_DESKTOP_CSS=String.raw`
@media (min-width:1880px) and (max-width:2000px) and (min-height:1000px) and (max-height:1160px) and (orientation:landscape) {
  #trophyRoom .trophyTabs {top:-44px; height:44px}
  #trophyRoom .trophyTab {
    min-height:44px; padding:6px 8px; line-height:1.15;
    white-space:normal; overflow-wrap:anywhere;
  }
  #trophyRoom .trophyCard h3 {
    white-space:normal; overflow-wrap:anywhere; line-height:1.1;
  }
  #trophyRoom .managerCounts > div {min-width:0}
  #trophyRoom .managerCounts span {
    white-space:normal; overflow-wrap:anywhere; line-height:1.1;
  }
}
`;

  // JOB-1331: 2560x1080 ultrawide uses the same 44px tab row, in its own range.
  const TROPHY_2560_ULTRAWIDE_CSS=String.raw`
@media (min-width:2500px) and (max-width:2620px) and (min-height:1040px) and (max-height:1120px) {
  #trophyRoom .trophyTabs {top:-44px; height:44px}
  #trophyRoom .trophyTab {min-height:44px; line-height:1.15}
}
`;

  // JOB-1327: upright 768x1024 tablet keeps Team V's stage too; 44px tab row only.
  const TROPHY_768_TABLET_CSS=String.raw`
@media (min-width:761px) and (max-width:820px) and (min-height:960px) and (max-height:1100px) and (orientation:portrait) {
  #trophyRoom .trophyTabs {top:-44px; height:44px}
  #trophyRoom .trophyTab {min-height:44px; line-height:1.15}
}
`;


  const TROPHY_SCREEN_1705_CSS=String.raw`
/* JOB-1705: approved NEXT_TROPHY_ROOM and picked-tab NEXT_TROPHY_ROOM_SINGLE.
   Study 1342 supplies portrait stacking; 1346 supplies the tablet ceremony rail.
   Study 1345 is not adopted: sideways composition stays live. Frozen artwork is read-only.
   Notes: picked desktop tab is one wide case, original 1536 trophy, name left/counts right.
   Baked marble, engraved emblems, room lighting and manager crops need Team V artwork. */
@media (min-width:0px) {
  html[data-v10-screen="trophyRoom"] #app > main {
    position:fixed; inset:0; z-index:30; padding:0; overflow-x:hidden; overflow-y:auto;
    overscroll-behavior:contain; scrollbar-color:#ad8539 #050607;
  }
  #app #trophyRoom.careerScreenV10 {
    position:relative; inset:auto; width:100%; max-width:none; height:auto!important;
    max-height:none; min-height:100svh; margin:0; padding:0; contain:none; overflow:visible!important;
  }
  #app #trophyRoom .trophyRoomScene {
    height:100svh!important; min-height:100svh!important; overflow:visible!important;
    --sr-hero:0px;
  }
  #app #trophyRoom .sd-stage__layer--ui {
    position:relative!important; inset:auto!important; height:auto!important;
    min-height:100svh!important; overflow:visible!important;
  }
  #app #trophyRoom .trophyRoomContent {overflow:visible!important}
  #app #trophyRoom :is(.trophyTab,.trophyBack) {touch-action:manipulation;clip-path:none}
  #app #trophyRoom :is(.trophyTab,.trophyBack):focus-visible,
  #app #trophyRoom .phoneMoreToggle:focus-visible ~ .trophyPhoneMoreButton {
    outline:3px solid #fff3bd; outline-offset:2px;
  }
  #app #trophyRoom :is(.trophyTab,.trophyBack):active:not(:disabled),
  #app #trophyRoom .phoneMoreToggle:active ~ .trophyPhoneMoreButton {filter:brightness(1.16)}
}
/* Touch portrait and sideways phones share these cabinet rules; the sideways block below re-seats the hero as a left rail.
   Normal entry fits the first view. Partial notices/details may expand main. */
@media (max-width:900px) and (orientation:portrait), (max-height:480px) and (orientation:landscape) {
  #app #trophyRoom {
    --tr-hub:var(--sd-nav-bottom-space,56px);
    --tr-hero:clamp(128px,calc(36svh - 44px),240px);
    --tr-row:clamp(86px,calc((100svh - var(--tr-hero) - var(--tr-hub) - 190px)/2),170px);
  }
  #app #trophyRoom :is(.sd-stage__layer--plate,.sd-stage__layer--cutout,.sd-stage__layer--light,
    .topbarReserve,.phoneNavReserve,.trophyPhoneNavReserve) {display:none!important}
  #app #trophyRoom .trophyPhoneArt {display:block;position:absolute;inset:0;bottom:auto;height:calc(var(--tr-hero) + 30px);overflow:hidden;pointer-events:none}
  #app #trophyRoom .trophyPhoneBackdrop {position:absolute;inset:0;display:block}
  #app #trophyRoom .trophyPhoneBackdrop img {width:100%;height:100%;object-fit:cover}
  #app #trophyRoom .trophyPhoneHero {
    display:block;position:absolute;top:44px;height:calc(var(--tr-hero) - 32px);
    width:48%;transform:none;filter:drop-shadow(0 6px 8px #000);
  }
  #app #trophyRoom .trophyPhoneHero--daniel {left:0;right:auto}
  #app #trophyRoom .trophyPhoneHero--nik {left:auto;right:0}
  #app #trophyRoom .trophyPhoneHero img {width:100%;height:100%;max-width:100%;object-fit:contain;object-position:center bottom}
  #app #trophyRoom .trophyPhoneArtShade {position:absolute;inset:0;background:linear-gradient(transparent 45%,#050607 100%)}
  #app #trophyRoom .trophyRoomContent.sd-stage__ui-content {
    position:relative;display:flex;flex-direction:column;align-items:stretch;
    height:auto!important;min-height:100svh; padding:calc(var(--tr-hero) + 8px) 10px calc(var(--tr-hub) + 60px);
    background:linear-gradient(transparent 0 var(--tr-hero),#050607 calc(var(--tr-hero) + 40px));
  }
  #app #trophyRoom .trophyTitleBlock {position:absolute;inset:8px 15% auto;display:block;width:70%;height:auto;margin:0;text-align:center}
  #app #trophyRoom .trophyBrushTitle {width:100%;height:clamp(28px,5.6svh,42px);margin:2px 0;object-fit:contain}
  #app #trophyRoom .trophyEyebrow {font-size:8px;line-height:1.2;letter-spacing:.14em}
  #app #trophyRoom .trophyTagline {font-size:7px;line-height:1.2;letter-spacing:.12em}
  #app #trophyRoom .heroCeremony {position:absolute;inset:106px 33% auto;width:34%;height:calc(var(--tr-hero) - 106px);margin:0;display:block}
  #app #trophyRoom .heroTrophyPicture {left:15%;top:0;width:70%;height:calc(100% - 28px)}
  #app #trophyRoom .heroPlinth {left:0;right:0;bottom:0;height:28px;min-height:28px;clip-path:none;padding:3px 1px}
  #app #trophyRoom .heroPlinth span {font-size:9px;line-height:1.1;white-space:normal;overflow:visible;letter-spacing:.03em}
  #app #trophyRoom .heroPlinth small {font-size:6px;line-height:1.1;letter-spacing:.06em}
  #app #trophyRoom .trophyShelf {position:relative;inset:auto;display:block;width:100%;height:auto;min-height:0;margin:0;padding:4px;border:1px solid #d5ac52;background:#050607d9;border-radius:0}
  #app #trophyRoom .trophyTabs {position:relative;inset:auto;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:2px;width:100%;height:auto;min-height:94px;margin:0 0 5px;padding:2px;border:1px solid #967734;background:#080908;overflow:visible;scroll-snap-type:none}
  #app #trophyRoom .trophyTab {grid-column:span 2;width:auto;min-width:0;min-height:44px;height:auto;padding:3px 2px;border:1px solid #836a36;border-radius:0;font-size:9px;line-height:1.2;letter-spacing:.025em;white-space:normal;overflow-wrap:normal}
  #app #trophyRoom .trophyTab:nth-child(n+4) {grid-column:span 2}
  #app #trophyRoom .shelfGlass {position:relative;inset:auto;display:block;min-height:0;padding:0;border:0;clip-path:none;overflow:visible;background:none}
  #app #trophyRoom .trophyGrid,
  #app #trophyRoom .trophyShelf.is-filtered .trophyGrid {position:relative;inset:auto;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-rows:minmax(var(--tr-row),auto);gap:5px;padding:0;overflow:visible;scroll-snap-type:none}
  /* r80 Europa League: five cases, three across and the last two centred under them (two rows, as with four cases). */
  #app #trophyRoom .trophyShelf:not(.is-filtered) .trophyGrid {grid-template-columns:repeat(6,minmax(0,1fr))}
  #app #trophyRoom .trophyShelf:not(.is-filtered) .trophyCard {grid-column:span 2}
  #app #trophyRoom .trophyShelf:not(.is-filtered) .trophyCard:nth-child(4) {grid-column:2 / span 2}
  #app #trophyRoom .trophyShelf.is-filtered .trophyGrid {grid-template-columns:minmax(0,1fr);grid-auto-rows:minmax(calc(2 * var(--tr-row) + 5px),auto)}
  #app #trophyRoom .trophyShelf.is-filtered .trophyCardPicture {height:max(18px,calc(2 * var(--tr-row) - 64px))}
  #app #trophyRoom .trophyCard {display:grid;grid-template-rows:minmax(18px,1fr) auto auto auto;flex:none;width:auto;min-width:0;min-height:0;height:auto;padding:3px 4px;border:1px solid #b4903d;background:radial-gradient(ellipse at 50% 10%,#9c743b4d,transparent 60%),linear-gradient(135deg,#31281a,#080908 45%);overflow:visible}
  #app #trophyRoom .trophyCardPicture {width:100%;height:max(18px,calc(var(--tr-row) - 64px));min-height:18px;align-self:stretch}
  #app #trophyRoom .trophyCard h3 {min-height:16px;line-height:1.25;margin:1px 0 2px;padding:1px 0;font-size:10px;letter-spacing:.02em;white-space:normal;overflow-wrap:normal;border-bottom:1px solid #79612e}
  #app #trophyRoom .managerCounts {min-height:26px;gap:4px;align-items:center}
  #app #trophyRoom .managerCounts > div {min-width:0;text-align:center}
  #app #trophyRoom .managerCounts > div + div {border-left:1px solid #65532a}
  #app #trophyRoom .managerCounts span {font-size:8px;line-height:1.2;white-space:normal;overflow-wrap:normal}
  #app #trophyRoom .managerCounts strong {font-size:13px;line-height:1.1}
  #app #trophyRoom .notWonYet {position:relative;inset:auto;min-height:10px;margin:2px 0 0;font-size:7px;line-height:1.2;letter-spacing:.04em}
  #app #trophyRoom .careerRanks,
  #app #trophyRoom .recordRibbon {display:none;position:relative;inset:auto;width:auto;height:auto;visibility:visible}
  #app #trophyRoom .trophyBack {display:flex;align-items:center;justify-content:center;color:#f4d485;font:700 11px/1 var(--sd-font-condensed,"Barlow Condensed",Arial,sans-serif);letter-spacing:.12em;position:fixed;left:10px;right:96px;bottom:calc(var(--tr-hub) + 8px);width:auto;height:44px;min-height:44px;margin:0;border:1px solid #d6b054;background:linear-gradient(#171710,#050607)}
  #app #trophyRoom .trophyPhoneMoreButton {display:flex;position:fixed;right:10px;bottom:calc(var(--tr-hub) + 8px);width:78px;height:44px;align-items:center;justify-content:center;border:1px solid #d6b054;background:linear-gradient(#171710,#050607);color:#f4d485;font:700 11px/1 var(--sd-font-condensed,"Barlow Condensed",Arial,sans-serif);letter-spacing:.12em;text-transform:uppercase;pointer-events:auto;z-index:43}
  #app #trophyRoom .phoneMoreToggle {display:block;position:fixed!important;right:10px!important;bottom:calc(var(--tr-hub) + 8px)!important;width:78px!important;height:44px!important;margin:0!important;opacity:0!important;clip:auto!important;clip-path:none!important;pointer-events:auto!important;z-index:42!important}
  #app #trophyRoom .trophyPhoneSheet.sd-sheet {display:none!important}
  #app #trophyRoom .phoneMoreToggle:checked ~ .trophyPhoneSheet.sd-sheet {display:block!important;position:absolute;inset:calc(var(--tr-hero) + 8px) 18px auto;height:52px;padding:8px;background:none;border:0;transform:none;pointer-events:none;z-index:20}
  #app #trophyRoom .phoneMoreToggle:checked ~ .trophyPhoneSheet.sd-sheet {width:auto;max-width:none;max-height:none;bottom:auto;opacity:1;visibility:visible;clip-path:none;box-shadow:none}
  #app #trophyRoom .trophyPhoneMoreClose {display:none}
  #app #trophyRoom .phoneMoreToggle:checked ~ .trophyPhoneMoreButton .trophyPhoneMoreOpen {display:none}
  #app #trophyRoom .phoneMoreToggle:checked ~ .trophyPhoneMoreButton .trophyPhoneMoreClose {display:inline}
  #app #trophyRoom .phoneMoreToggle:checked ~ .trophyPhoneMoreButton {background:linear-gradient(#e8c96d,#c99839);color:#111}
  #app #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .shelfGlass {visibility:visible}
  #app #trophyRoom .trophyPhoneSheetTitle {display:block;font-size:15px}
  #app #trophyRoom .trophyPhoneSheetHint {display:block;font-size:9px;color:#baae90}
  #app #trophyRoom .trophyPhoneSheetClose {display:none}
  #app #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .careerRanks {display:grid;order:0;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:56px 0 8px;pointer-events:none}
  #app #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .careerRank {position:relative;inset:auto!important;width:auto;min-width:0;height:auto;min-height:90px;padding:10px 5px;text-align:center;border:1px solid #8b713c}
  #app #trophyRoom .careerRank small {font-size:8px;line-height:1.3;white-space:normal;overflow:visible;text-overflow:clip;overflow-wrap:normal}
  #app #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent :is(.trophyTabs,.trophyGrid) {display:none}
  #app #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .recordRibbon {display:grid;position:relative;inset:auto;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;padding:8px;overflow:visible;visibility:visible}
  #app #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .recordRibbonHeading {grid-column:1/-1;min-height:28px;padding:4px;font-size:11px}
  #app #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .recordItem {min-width:0;min-height:54px;padding:6px}
  #app #trophyRoom .recordItem small {white-space:normal;overflow:visible;text-overflow:clip;overflow-wrap:normal;font-size:9px;line-height:1.2}
  #app #trophyRoom :is(.stateNotice,.statePanel,.fatalState) {position:relative;inset:auto;width:auto;height:auto;min-height:44px;margin:0 0 8px;padding:10px;white-space:normal;overflow-wrap:normal}
  #app #trophyRoom .stateNotice {flex-wrap:wrap;gap:6px;font-size:10px;text-align:center}
  #app #trophyRoom .statePanel {min-height:calc(2 * var(--tr-row) - 4px)}
}
/* Sideways phones (study 1345 not adopted, so no new composition): the live parts keep their order, with the
   managers and champion trophy as a left rail and the tabs, cabinet and BACK/MORE in a right column. */
@media (max-height:480px) and (orientation:landscape) {
  #app #trophyRoom {
    --tr-lcol:clamp(220px,34vw,320px);
    --tr-hero:calc(100svh - var(--tr-hub) - 10px);
    --tr-row:clamp(104px,calc(100svh - var(--tr-hub) - 134px),230px);
  }
  #app #trophyRoom .trophyPhoneArt {inset:0 0 auto 0;height:calc(100svh - var(--tr-hub))}
  #app #trophyRoom .trophyPhoneHero {top:50px;height:calc(var(--tr-hero) - 56px);width:calc(var(--tr-lcol) * .52)}
  #app #trophyRoom .trophyPhoneHero--daniel {left:calc(var(--tr-lcol) * -.07);right:auto}
  #app #trophyRoom .trophyPhoneHero--nik {left:calc(var(--tr-lcol) * .55);right:auto}
  #app #trophyRoom .trophyPhoneArtShade {background:linear-gradient(90deg,transparent calc(var(--tr-lcol) * .92),#050607f2 calc(var(--tr-lcol) * 1.12)),linear-gradient(transparent 70%,#050607)}
  #app #trophyRoom .trophyRoomContent.sd-stage__ui-content {
    display:block;min-height:100svh;background:none;
    padding:8px 54px calc(var(--tr-hub) + 60px) calc(var(--tr-lcol) + 10px);
  }
  #app #trophyRoom .trophyTitleBlock {inset:6px auto auto 0;width:var(--tr-lcol)}
  #app #trophyRoom .heroCeremony {inset:calc(var(--tr-hero) * .42) auto auto calc(var(--tr-lcol) * .29);width:calc(var(--tr-lcol) * .42);height:calc(var(--tr-hero) * .54)}
  #app #trophyRoom .trophyTabs {grid-template-columns:repeat(6,minmax(0,1fr));min-height:48px;margin-bottom:4px}
  #app #trophyRoom .trophyTab,
  #app #trophyRoom .trophyTab:nth-child(n+4) {grid-column:auto;font-size:9px;padding:2px 3px}
  #app #trophyRoom .trophyShelf:not(.is-filtered) .trophyGrid {grid-template-columns:repeat(5,minmax(0,1fr))}
  #app #trophyRoom .trophyShelf:not(.is-filtered) .trophyCard,
  #app #trophyRoom .trophyShelf:not(.is-filtered) .trophyCard:nth-child(4) {grid-column:auto}
  #app #trophyRoom .trophyShelf.is-filtered .trophyGrid {grid-template-columns:minmax(0,1fr);grid-auto-rows:minmax(var(--tr-row),auto)}
  #app #trophyRoom .trophyCardPicture,
  #app #trophyRoom .trophyShelf.is-filtered .trophyCardPicture {height:max(18px,calc(var(--tr-row) - 76px))}
  #app #trophyRoom .trophyBack {left:calc(var(--tr-lcol) + 10px);right:142px;bottom:calc(var(--tr-hub) + 6px)}
  #app #trophyRoom .trophyPhoneMoreButton {right:54px;bottom:calc(var(--tr-hub) + 6px)}
  #app #trophyRoom .phoneMoreToggle {right:54px!important;bottom:calc(var(--tr-hub) + 6px)!important}
  #app #trophyRoom .phoneMoreToggle:checked ~ .trophyPhoneSheet.sd-sheet {inset:8px 54px auto calc(var(--tr-lcol) + 10px);height:40px;padding:4px 0}
  #app #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .careerRanks {margin:40px 0 6px}
  #app #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .careerRank {min-height:64px;padding:6px 5px}
  #app #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .recordRibbon {grid-template-columns:repeat(3,minmax(0,1fr));gap:4px;padding:6px}
  #app #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .recordItem {min-height:46px;padding:4px 6px}
  #app #trophyRoom .stateNotice {min-height:36px;padding:4px 8px;margin-bottom:4px;gap:0 8px;font-size:10px;line-height:1.2}
  #app #trophyRoom .statePanel {min-height:calc(var(--tr-row) - 10px)}
}
@media (min-width:761px) and (max-width:900px) and (orientation:portrait) {
  #app #trophyRoom {--tr-hero:0px;--tr-row:clamp(210px,calc((75svh - var(--tr-hub) - 234px)/2),330px)}
  #app #trophyRoom .trophyRoomContent.sd-stage__ui-content {padding:25svh 20px calc(var(--tr-hub) + 88px) 35%;background:linear-gradient(transparent,#050607cc 50%,#050607)}
  #app #trophyRoom .trophyPhoneArt {height:calc(100svh - var(--tr-hub));overflow:hidden}
  #app #trophyRoom .trophyPhoneHero {top:14svh;height:28svh;width:22%}
  #app #trophyRoom .trophyPhoneHero--daniel {left:0}
  #app #trophyRoom .trophyPhoneHero--nik {left:14%;right:auto}
  #app #trophyRoom .trophyTitleBlock {top:3svh;left:14%;right:auto;width:72%}
  #app #trophyRoom .trophyBrushTitle {height:clamp(60px,8svh,90px)}
  #app #trophyRoom .trophyEyebrow {font-size:12px;letter-spacing:.22em}
  #app #trophyRoom .trophyTagline {font-size:10px}
  #app #trophyRoom .heroCeremony {top:43svh;left:3%;width:29%;height:clamp(220px,31svh,380px)}
  #app #trophyRoom .heroTrophyPicture {left:4%;width:92%;height:calc(100% - 52px)}
  #app #trophyRoom .heroPlinth {height:52px;min-height:52px;padding:8px 2px}
  #app #trophyRoom .heroPlinth span {font-size:12px}
  #app #trophyRoom .heroPlinth small {font-size:8px}
  #app #trophyRoom .trophyShelf {padding:8px}
  #app #trophyRoom .trophyTabs {gap:4px;padding:4px;margin-bottom:10px;min-height:100px}
  #app #trophyRoom .trophyTab {font-size:12px}
  #app #trophyRoom .trophyGrid {gap:10px}
  #app #trophyRoom .trophyCard {padding:8px}
  #app #trophyRoom .trophyCardPicture {height:calc(var(--tr-row) - 108px)}
  #app #trophyRoom .trophyShelf.is-filtered .trophyCardPicture {height:calc(2 * var(--tr-row) - 108px)}
  #app #trophyRoom .trophyCard h3 {min-height:28px;font-size:14px}
  #app #trophyRoom .managerCounts {min-height:44px}
  #app #trophyRoom .managerCounts span {font-size:12px}
  #app #trophyRoom .managerCounts strong {font-size:21px}
  #app #trophyRoom .notWonYet {min-height:16px;font-size:10px}
  #app #trophyRoom .trophyBack {left:35%;right:116px;bottom:calc(var(--tr-hub) + 20px);height:56px;font-size:18px}
  #app #trophyRoom .trophyPhoneMoreButton {right:20px;bottom:calc(var(--tr-hub) + 20px);width:84px;height:56px;font-size:13px}
  #app #trophyRoom .phoneMoreToggle {right:20px!important;bottom:calc(var(--tr-hub) + 20px)!important;width:84px!important;height:56px!important}
  #app #trophyRoom .phoneMoreToggle:checked ~ .trophyPhoneSheet.sd-sheet {top:25svh;left:calc(35% + 16px);right:28px;height:60px}
  #app #trophyRoom .trophyPhoneSheetTitle {font-size:22px}
  #app #trophyRoom .trophyPhoneSheetHint {font-size:12px}
  #app #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .careerRanks {margin-top:72px}
  #app #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .careerRank {min-height:130px;padding:18px 8px}
  #app #trophyRoom .careerRank small {font-size:10px}
}
@media (min-width:901px) and (min-height:481px) {
  #app #trophyRoom {--tr-case:clamp(90px,calc(14svh - 2px),160px)}
  #app #trophyRoom .trophyPhoneArt {display:none!important}
  #app #trophyRoom .trophyRoomContent.sd-stage__ui-content {display:flex;flex-direction:column;height:auto!important;min-height:100svh;padding:calc(62svh - 20px) 8% 14px;background:none}
  #app #trophyRoom .trophyTitleBlock {position:absolute;top:9svh;left:34%;width:32%;height:16svh;margin:0}
  #app #trophyRoom .heroCeremony {position:absolute;top:26svh;left:36.3%;width:27.4%;height:calc(36svh - 62px);margin:0}
  #app #trophyRoom .heroPlinth {clip-path:none;border-color:#d5ac52}
  /* r80: the rank cards stand on a line 6px above the tab row and grow upward when their line wraps; they used to hang from
     the top and slid 5-6px under the tabs on short windows (1280x650, 1024x768). */
  #app #trophyRoom .careerRanks {position:absolute;inset:auto 12% auto;top:calc(62svh - 92px);height:66px;display:block}
  #app #trophyRoom .careerRank {top:auto;bottom:0;min-width:0;width:18%;min-height:66px}
  #app #trophyRoom .careerRank small {font-size:clamp(8px,.52vw,11px);line-height:1.25;white-space:normal;overflow-wrap:normal}
  #app #trophyRoom .trophyShelf {position:relative;inset:auto;display:block;width:100%;height:auto;min-height:0;margin:0;padding:0;background:none;border:0;border-radius:0}
  #app #trophyRoom .trophyTabs {position:relative;inset:auto;width:100%;height:auto;min-height:44px;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:1px;overflow:visible}
  #app #trophyRoom .trophyTab {height:auto;min-height:44px;padding:6px 8px;font-size:clamp(10px,.66vw,14px);line-height:1.2;white-space:normal;overflow-wrap:normal}
  #app #trophyRoom .shelfGlass {position:relative;inset:auto;padding:5px;clip-path:none;overflow:visible;border-color:#d5ac52;box-shadow:inset 0 0 0 2px #080909,0 10px 30px #0008}
  #app #trophyRoom .trophyGrid {position:relative;inset:auto;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));grid-auto-rows:minmax(clamp(90px,14svh,160px),auto);gap:8px;overflow:visible}
  #app #trophyRoom .trophyCard {display:grid;grid-template-rows:minmax(24px,1fr) auto auto auto;min-height:0;height:auto;padding:4px 8px;border:1px solid #a9873b;overflow:visible;background:radial-gradient(ellipse at 50% 10%,#96743944,transparent 65%),linear-gradient(#28221988,#080909)}
  #app #trophyRoom .trophyCardPicture {width:100%;height:max(24px,calc(clamp(90px,14svh,160px) - 60px));min-height:24px}
  #app #trophyRoom .trophyCard h3 {margin:2px 0 4px;min-height:14px;font-size:clamp(11px,.72vw,16px);line-height:1.2;white-space:normal;overflow-wrap:normal;letter-spacing:.06em}
  #app #trophyRoom .managerCounts > div {min-width:0}
  #app #trophyRoom .managerCounts span {font-size:clamp(8px,.47vw,11px);line-height:1.15;white-space:normal;overflow-wrap:normal}
  #app #trophyRoom .managerCounts strong {font-size:clamp(15px,1.15vw,25px);line-height:1.1}
  #app #trophyRoom .notWonYet {position:relative;inset:auto;margin:2px 0 0;min-height:10px;font-size:clamp(8px,.55vw,12px);line-height:1.15;letter-spacing:.04em}
  #app #trophyRoom .recordRibbon {position:relative;inset:auto;height:auto;min-height:44px;grid-template-columns:minmax(90px,.6fr) repeat(5,minmax(0,1fr));margin-top:5px;overflow:visible}
  #app #trophyRoom .recordRibbonHeading {font-size:clamp(9px,.58vw,13px);line-height:1.2;padding:5px 7px}
  #app #trophyRoom .recordItem {padding:5px 7px;row-gap:3px}
  #app #trophyRoom .recordItem small {font-size:clamp(9px,.62vw,14px);line-height:1.2;white-space:normal;overflow:visible;text-overflow:clip;overflow-wrap:normal}
  #app #trophyRoom :is(.stateNotice,.statePanel,.fatalState) {position:relative;inset:auto;height:auto;min-height:44px;padding:12px;margin:0 0 6px}
  #app #trophyRoom .stateNotice {flex-wrap:wrap;gap:8px;font-size:12px;text-align:center}
  #app #trophyRoom .statePanel {min-height:16svh}
  #app #trophyRoom .trophyBack {position:sticky;inset:auto;bottom:12px;align-self:center;width:21%;min-width:180px;min-height:44px;height:clamp(44px,4.8svh,56px);margin:12px 0 0;border:2px solid #d6b054;border-radius:4px;background:linear-gradient(#252218,#050607);box-shadow:inset 0 0 0 2px #080909,0 0 12px #c5952733}
  /* Picked category: same live article and counts; CSS areas preserve DOM/tap order. */
  #app #trophyRoom .trophyShelf.is-filtered .trophyGrid {grid-template-columns:minmax(0,1fr);grid-auto-rows:var(--tr-case)}
  #app #trophyRoom .trophyShelf.is-filtered .trophyCard {height:var(--tr-case);min-height:0;overflow:hidden;grid-template-columns:minmax(0,1fr) minmax(0,1fr) minmax(0,1fr);grid-template-rows:minmax(0,1fr) auto;grid-template-areas:"name art counts" "empty art counts";column-gap:16px;padding:6px 4%;align-items:center}
  #app #trophyRoom .trophyShelf.is-filtered .trophyCardPicture {grid-area:art;position:relative;align-self:stretch;height:100%;min-height:0;overflow:hidden;background-position:center;background-size:contain;background-repeat:no-repeat}
  #app #trophyRoom .trophyShelf.is-filtered .trophyCardPicture img {position:absolute;inset:0;width:100%;height:100%;object-fit:contain;visibility:hidden}
  #app #trophyRoom .trophyShelf.is-filtered [data-trophy="showdown"] .trophyCardPicture {background-image:url("visual-assets/v10_1/shared/trophies/TRO_SHOWDOWN_CHAMPION_V1_1536.webp")}
  #app #trophyRoom .trophyShelf.is-filtered [data-trophy="leagueTitles"] .trophyCardPicture {background-image:url("visual-assets/v10_1/shared/trophies/TRO_LEAGUE_TITLE_V1_1536.webp")}
  #app #trophyRoom .trophyShelf.is-filtered [data-trophy="domesticCups"] .trophyCardPicture {background-image:url("visual-assets/v10_1/shared/trophies/TRO_DOMESTIC_CUP_V1_1536.webp")}
  #app #trophyRoom .trophyShelf.is-filtered [data-trophy="championsLeague"] .trophyCardPicture {background-image:url("visual-assets/v10_1/shared/trophies/TRO_CONTINENTAL_V1_1536.webp")}
  #app #trophyRoom .trophyShelf.is-filtered [data-trophy="europaLeague"] .trophyCardPicture {background-image:url("visual-assets/v10_1/shared/trophies/TRO_EUROPA_V1_1536.webp")}
  #app #trophyRoom .trophyShelf.is-filtered .trophyCard h3 {grid-area:name;margin:0;padding:12px 0;border-block:1px solid #a9873b;font-size:clamp(18px,1.5vw,34px);text-align:center}
  #app #trophyRoom .trophyShelf.is-filtered .managerCounts {grid-area:counts;gap:12px;width:100%}
  #app #trophyRoom .trophyShelf.is-filtered .managerCounts > div {text-align:center}
  #app #trophyRoom .trophyShelf.is-filtered .managerCounts > div + div {border-left:1px solid #a9873b}
  #app #trophyRoom .trophyShelf.is-filtered .managerCounts span {font-size:clamp(12px,.9vw,20px);color:#f4dc8b}
  #app #trophyRoom .trophyShelf.is-filtered .managerCounts strong {font-size:clamp(28px,3vw,64px);color:#f4dc8b}
  #app #trophyRoom .trophyShelf.is-filtered .notWonYet {grid-area:empty;margin:0;padding:4px 0;text-align:center}
}
/* r80 short screens: on 600px-tall desktop windows (1100x600, 1024x600) the cabinet ran 5px under the docked BACK. There
   BACK joins the flow under the cabinet, so it never sits on the shelf; main scrolls the few pixels to reach it. */
@media (min-width:901px) and (min-height:481px) and (max-height:630px) {
  #app #trophyRoom .trophyBack {position:relative;bottom:auto}
}
/* r78 HO-031 v3 phone marble: upright phones up to 400px wide draw Team V's ENV_TROPHY_ROOM_PHONE_V3 (both managers
   painted in, set wider apart and a little smaller so the faces sit between the title and the shelf) in place of the old
   phone backdrop and the two cut-outs (their picture sources only match the other phone and tablet sizes). The plate
   covers the whole screen from the top behind the unchanged layout (title, champion trophy, tabs, cabinet, BACK and
   MORE stay where they were). No dark shade or grade over the men. Wider upright screens and sideways phones keep the
   old art: there the shelf or the title would sit on the faces. */
@media (max-width:400px) and (orientation:portrait) {
  #app #trophyRoom .trophyPhoneArt {inset:0;height:100svh}
  #app #trophyRoom .trophyPhoneBackdrop {inset:0;overflow:hidden}
  #app #trophyRoom .trophyPhoneBackdrop img {position:absolute;left:50%;top:0;width:max(100vw,calc(100svh * 1179 / 2096));height:auto;max-width:none;transform:translateX(-50%);object-fit:fill}
  #app #trophyRoom :is(.trophyPhoneHero,.trophyPhoneArtShade) {display:none}
  #app #trophyRoom .trophyRoomContent.sd-stage__ui-content {background:none}
}
`;

  // JOB-1706: Career Statistics phone, sideways and tablet adapter rules; the phone art also loads at sideways and tablet sizes.
  const CS_PHONE_ART_MEDIA="(max-width: 760px) and (orientation: portrait), (min-width: 640px) and (max-width: 880px) and (min-height: 340px) and (max-height: 410px) and (orientation: landscape), (min-width: 700px) and (max-width: 900px) and (min-height: 960px) and (max-height: 1240px) and (orientation: portrait)";
  const CAREER_STATS_1706_CSS=String.raw`
/* JOB-1706: Career Statistics at phone, sideways and tablet (adopted studies 1402, 1403, 1404 and PHONE_STATISTICS).
   Desktop (1200x700 and up, css/v10Shell.css) is untouched. Nothing scrolls: the stage fits the first view above the hub bar.
   Words, ids, numbers and tap order are the live ones; old desktop art is hidden by class, never by src. */
@media (max-width:760px) and (orientation:portrait) {
  /* The desktop arm cutout and rim layers were 540px wide on a 393px phone (they poked out on both sides). */
  #app #careerStatistics.careerScreenV10 :is(.sd-stage__layer--cutout,.sd-stage__layer--light) .sd-stage__registered { display:none; }
}
@media (max-width:760px) and (orientation:portrait) {
  /* A totals tile is 34px tall at 360x640 and 393x660, which cut the TOGETHER caption under the number; it now sits beside it. */
  #app #careerStatistics.careerScreenV10 .headlineCopy { display:grid;grid-template-columns:auto minmax(0,1fr);align-items:end;column-gap:5px; }
  #app #careerStatistics.careerScreenV10 .headlineCopy>:not(.headlineNumber,.headlineTogether) { grid-column:1/-1; }
  #app #careerStatistics.careerScreenV10 .headlineTogether { padding-bottom:2px;white-space:nowrap; }
}
@media (max-width:760px) and (orientation:portrait) and (min-height:601px) {
  /* The hub starts higher (the managers' faces stay clear) so the six comparison rows and four leader cards are not cut. */
  #app #careerStatistics.careerScreenV10 .phoneHub { top:41%; }
  /* The partial-history banner sat on the totals; it now ends just above them (the banner is placed on the whole screen,
     the hub on the screen less the hub bar). */
  #app #careerStatistics.careerScreenV10 .partialBanner { top:calc((100% - 56px - env(safe-area-inset-bottom)) * .41 - 27px); }
}
@media (max-width:760px) and (orientation:portrait) and (max-height:600px) {
  /* Short phones: without the rivalry button the two actions share one row, in tap order, and the hub takes the freed
     50px so the comparison rows and leader cards are not cut. */
  #app #careerStatistics.careerScreenV10 .actionRow:has(>#careerStatisticsRivalryButton.hidden) {
   height:46px;grid-template-columns:1.25fr 1fr;grid-template-rows:46px;grid-template-areas:"trophy back";
  }
  #app #careerStatistics.careerScreenV10 .careerScreen:has(.actionRow>#careerStatisticsRivalryButton.hidden) .phoneHub { bottom:58px; }
  #app #careerStatistics.careerScreenV10 .partialBanner { top:calc((100% - 56px - env(safe-area-inset-bottom)) * .42 - 39px); }
}
@media (max-width:760px) and (orientation:portrait),
       (min-width:640px) and (max-width:880px) and (min-height:340px) and (max-height:410px) and (orientation:landscape),
       (min-width:700px) and (max-width:900px) and (min-height:960px) and (max-height:1240px) and (orientation:portrait) {
  /* Partial history: the base partial rules (top 43.25%, height 18.92%) left the table and comparison panels 21-60px tall inside the hub. */
  #app #careerStatistics.careerScreenV10 .careerStage[data-state="partial"] .contentGrid>:is(.careerTablePanel,.comparisonPanel) { top:auto;height:100%; }
  #app #careerStatistics.careerScreenV10 .phoneTabs label:active { filter:brightness(1.2); }
  #app #careerStatistics.careerScreenV10 .actionButton:focus-visible { outline:3px solid #fff1b8; outline-offset:2px; }
  #app #careerStatistics.careerScreenV10 .actionButton:active { filter:brightness(.88); }
}
/* Sideways and tablet: the phone composition (phone background, Daniel left, Nik right) on the whole stage,
   with the hub bar kept clear at the bottom. */
@media (min-width:640px) and (max-width:880px) and (min-height:340px) and (max-height:410px) and (orientation:landscape),
       (min-width:700px) and (max-width:900px) and (min-height:960px) and (max-height:1240px) and (orientation:portrait) {
  #app #careerStatistics.careerScreenV10 { --cs-nav:calc(56px + env(safe-area-inset-bottom)); }
  #app #careerStatistics.careerScreenV10 :is(.sd-stage__layer--plate,.sd-stage__layer--cutout,.sd-stage__layer--light .sd-stage__registered,.armCutout,.armRim,.contactShadow,.phoneHeroContact) { display:none; }
  #app #careerStatistics.careerScreenV10 .phoneSceneArt { display:block;position:absolute;z-index:2;inset:0;overflow:hidden;pointer-events:none; }
  #app #careerStatistics.careerScreenV10 .phoneBackground { position:absolute;z-index:0;inset:0;overflow:hidden; }
  #app #careerStatistics.careerScreenV10 .phoneBackground img { display:block;width:100%;height:100%;object-fit:cover;object-position:50% 36%; }
  #app #careerStatistics.careerScreenV10 .phoneSceneArt::after { content:"";position:absolute;z-index:4;pointer-events:none; }
  #app #careerStatistics.careerScreenV10 .phoneHero { position:absolute;z-index:3;width:auto;filter:drop-shadow(0 10px 12px rgba(0,0,0,.5)) drop-shadow(0 0 3px rgba(255,211,77,.32)); }
  #app #careerStatistics.careerScreenV10 .phoneHero img { display:block;width:auto;height:100%;object-fit:contain; }
  #app #careerStatistics.careerScreenV10 .careerScreen { inset:0 0 var(--cs-nav);overflow:hidden; }
  #app #careerStatistics.careerScreenV10 .phoneFaceBand { display:block;position:absolute;z-index:3;pointer-events:none; }
  #app #careerStatistics.careerScreenV10 .titleBlock { z-index:6;height:auto;display:grid;justify-items:center;row-gap:4px; }
  #app #careerStatistics.careerScreenV10 .titleBlock :is(.sd-eyebrow,.sd-tagline,.titleWordmark) { position:relative;inset:auto;width:auto;margin:0; }
  #app #careerStatistics.careerScreenV10 .titleBlock .sd-eyebrow { display:none; }
  #app #careerStatistics.careerScreenV10 .titleWordmark { width:100%; }
  #app #careerStatistics.careerScreenV10 .previewChip { z-index:9;transform:none; }
  #app #careerStatistics.careerScreenV10 .phoneHub { position:absolute;z-index:7;display:grid;min-height:0; }
  #app #careerStatistics.careerScreenV10 .headlineTiles { position:relative;inset:auto;width:auto;height:auto;display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr));grid-template-rows:minmax(0,1fr); }
  #app #careerStatistics.careerScreenV10 .headlineTile { clip-path:polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px); }
  #app #careerStatistics.careerScreenV10 .phoneTabControl { display:block;position:absolute;width:1px;height:1px;opacity:0;clip-path:inset(50%);pointer-events:auto;font-size:16px; }
  #app #careerStatistics.careerScreenV10 .phoneTabs {
   display:grid;grid-template-columns:repeat(3,1fr);min-height:44px;border:1px solid rgba(245,197,24,.58);background:rgba(7,8,10,.82);
   clip-path:polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px);
  }
  #app #careerStatistics.careerScreenV10 .phoneTabs label {
   min-width:0;min-height:44px;display:grid;place-items:center;cursor:pointer;color:#b9b3a4;border-right:1px solid rgba(245,197,24,.24);
   font:700 11px/1 var(--sd-font-condensed,"Barlow Condensed",sans-serif);letter-spacing:.12em;
  }
  #app #careerStatistics.careerScreenV10 .phoneTabs label:last-child { border-right:0; }
  #app #careerStatistics.careerScreenV10 #careerPhoneTable:checked~.phoneTabs label[for="careerPhoneTable"],
  #app #careerStatistics.careerScreenV10 #careerPhoneCompare:checked~.phoneTabs label[for="careerPhoneCompare"],
  #app #careerStatistics.careerScreenV10 #careerPhoneLeaders:checked~.phoneTabs label[for="careerPhoneLeaders"] { color:#07080a;background:linear-gradient(135deg,#ffe07e,#f5c518 58%,#d4a017); }
  #app #careerStatistics.careerScreenV10 #careerPhoneTable:focus-visible~.phoneTabs label[for="careerPhoneTable"],
  #app #careerStatistics.careerScreenV10 #careerPhoneCompare:focus-visible~.phoneTabs label[for="careerPhoneCompare"],
  #app #careerStatistics.careerScreenV10 #careerPhoneLeaders:focus-visible~.phoneTabs label[for="careerPhoneLeaders"] { outline:3px solid #fff1b8;outline-offset:-3px; }
  #app #careerStatistics.careerScreenV10 .contentGrid { position:relative;min-height:0;overflow:hidden; }
  #app #careerStatistics.careerScreenV10 .contentGrid>:is(.careerTablePanel,.comparisonPanel,.leadersPanel,.statePanel) { position:relative;inset:auto;width:100%;height:100%;min-height:0;margin:0; }
  #app #careerStatistics.careerScreenV10 .contentGrid>.statePanel:not([hidden]) { display:grid; }
  #app #careerStatistics.careerScreenV10 .careerStage:is([data-state="empty"],[data-state="unavailable"],[data-state="loading"]) .phoneTabs { visibility:hidden; }
  #app #careerStatistics.careerScreenV10 .careerStage:is([data-state="empty"],[data-state="unavailable"],[data-state="loading"]) .contentGrid>:is(.careerTablePanel,.comparisonPanel,.leadersPanel) { display:none!important; }
  #app #careerStatistics.careerScreenV10 .careerTable { width:calc(100% - 12px);margin:3px 6px 0; }
  #app #careerStatistics.careerScreenV10 .actionRow { display:grid!important;position:absolute;z-index:12;top:auto;width:auto;grid-template-columns:1fr 1.2fr 1fr; }
  #app #careerStatistics.careerScreenV10 .actionRow:has(>#careerStatisticsRivalryButton.hidden) { grid-template-columns:1.2fr 1fr; }
  #app #careerStatistics.careerScreenV10 .actionRow .actionButton { min-width:0;min-height:44px;height:auto;touch-action:manipulation; }
  #app #careerStatistics.careerScreenV10 .actionRow .actionLabel { white-space:normal;line-height:1.1;overflow-wrap:normal;word-break:normal; }
  #app #careerStatistics.careerScreenV10 .statePanel { padding:10px 14px;place-content:center; }
}
/* Sideways (study 1403): title and managers on the left; totals, the three tabs, the picked panel and the actions on the right. */
@media (min-width:640px) and (max-width:880px) and (min-height:340px) and (max-height:410px) and (orientation:landscape) {
  #app #careerStatistics.careerScreenV10 .phoneSceneArt::after { inset:0 0 0 44%;background:linear-gradient(90deg,transparent,rgba(5,6,8,.55) 12%,rgba(5,6,8,.85) 100%); }
  #app #careerStatistics.careerScreenV10 .phoneHero { top:58px;height:calc(100% - 58px - var(--cs-nav) + 18px); }
  #app #careerStatistics.careerScreenV10 .phoneHeroDaniel { left:0; }
  #app #careerStatistics.careerScreenV10 .phoneHeroNik { left:auto;right:57%; }
  #app #careerStatistics.careerScreenV10 .phoneFaceBand { inset:0 auto 0 0;width:44%;height:auto;background:none; }
  #app #careerStatistics.careerScreenV10 .titleBlock { left:6%;top:8px;width:88%; }
  #app #careerStatistics.careerScreenV10 .titleBlock .sd-tagline { font-size:8px;letter-spacing:.24em; }
  #app #careerStatistics.careerScreenV10 .previewChip { top:6px;left:10px; }
  #app #careerStatistics.careerScreenV10 .phoneHub { left:45%;right:12px;top:8px;bottom:60px;grid-template-rows:50px 44px minmax(0,1fr);gap:5px; }
  /* The corner Settings button sits over the right end of the totals row. */
  #app #careerStatistics.careerScreenV10 .headlineTiles { gap:4px;margin-right:52px; }
  /* Four totals share a narrow column here, so the decorative icons give their room to the numbers. */
  #app #careerStatistics.careerScreenV10 .headlineTile { grid-template-columns:minmax(0,1fr);gap:0;padding:3px 6px; }
  #app #careerStatistics.careerScreenV10 .headlineIcon { display:none; }
  #app #careerStatistics.careerScreenV10 .headlineLabel { font-size:8px;letter-spacing:.04em; }
  #app #careerStatistics.careerScreenV10 .headlineTogether { font-size:6px;letter-spacing:.08em; }
  #app #careerStatistics.careerScreenV10 .headlineNumber { font-size:22px; }
  #app #careerStatistics.careerScreenV10 .headlinePair { gap:2px;margin-top:1px; }
  #app #careerStatistics.careerScreenV10 .headlinePair b { font-size:17px; }
  #app #careerStatistics.careerScreenV10 .headlinePair small { font-size:7px; }
  #app #careerStatistics.careerScreenV10 .contentGrid>:is(.careerTablePanel,.comparisonPanel,.leadersPanel) { display:none; }
  #app #careerStatistics.careerScreenV10 #careerPhoneTable:checked~.contentGrid .careerTablePanel,
  #app #careerStatistics.careerScreenV10 #careerPhoneCompare:checked~.contentGrid .comparisonPanel,
  #app #careerStatistics.careerScreenV10 #careerPhoneLeaders:checked~.contentGrid .leadersPanel { display:block; }
  #app #careerStatistics.careerScreenV10 .panelTitle { padding:4px 8px 3px;font-size:11px; }
  #app #careerStatistics.careerScreenV10 .careerTable th { padding:3px 2px;font-size:9px;letter-spacing:.03em; }
  #app #careerStatistics.careerScreenV10 .careerTable td { padding:5px 2px;font-size:11px; }
  #app #careerStatistics.careerScreenV10 .comparisonBody { padding:2px 9px 3px; }
  #app #careerStatistics.careerScreenV10 .compareRow { grid-template-columns:38px 1fr 38px;gap:0 6px;padding:0; }
  #app #careerStatistics.careerScreenV10 .compareRow :is(.dValue,.nValue) { font-size:10px; }
  #app #careerStatistics.careerScreenV10 .compareLabel { font-size:8px; }
  #app #careerStatistics.careerScreenV10 .compareTrack { height:3px;margin-top:1px; }
  #app #careerStatistics.careerScreenV10 .leaderGrid { grid-template-columns:repeat(2,minmax(0,1fr));gap:4px;padding:4px 6px 6px; }
  #app #careerStatistics.careerScreenV10 .leaderCard { height:auto;min-height:32px;grid-template-columns:22px minmax(0,1fr);gap:5px;padding:2px 14px 2px 5px; }
  #app #careerStatistics.careerScreenV10 .managerPortrait { width:20px;height:28px; }
  #app #careerStatistics.careerScreenV10 .leaderLabel { font-size:7px; }
  #app #careerStatistics.careerScreenV10 .leaderName { margin-top:1px;font-size:9px; }
  #app #careerStatistics.careerScreenV10 .leaderValue { margin-top:1px;font-size:13px; }
  #app #careerStatistics.careerScreenV10 .actionRow { left:45%;right:12px;bottom:8px;height:44px;gap:6px; }
  #app #careerStatistics.careerScreenV10 .actionRow .actionButton { padding:0 8px;grid-template-columns:22px 1fr 10px;gap:5px;font-size:10px; }
  #app #careerStatistics.careerScreenV10 .actionButton img { width:21px;height:27px; }
  #app #careerStatistics.careerScreenV10 .buttonIcon { width:18px;height:18px; }
  #app #careerStatistics.careerScreenV10 .partialBanner { left:45%;right:12px;top:auto;bottom:calc(var(--cs-nav) + 56px);width:auto;gap:7px;padding:3px 6px; }
  #app #careerStatistics.careerScreenV10 .careerStage[data-state="partial"] .phoneHub { bottom:96px; }
  #app #careerStatistics.careerScreenV10 .statePanel h2 { font-size:15px; }
  #app #careerStatistics.careerScreenV10 .statePanel p { margin-top:5px;font-size:11px;line-height:1.25; }
  #app #careerStatistics.careerScreenV10 .stateIcon { width:30px;height:30px;margin-bottom:5px;font-size:16px; }
}
/* 740x360 partial history: the banner wraps to its tallest, so the hub ends 10px lower to show all six comparison rows and both leader rows. */
@media (min-width:640px) and (max-width:880px) and (min-height:340px) and (max-height:375px) and (orientation:landscape) {
  #app #careerStatistics.careerScreenV10 .careerStage[data-state="partial"] .phoneHub { bottom:86px; }
}
/* Upright tablet (study 1404): managers either side under the title, four totals in one row, table and comparison side by
   side above the leaders row, all three panels at once (the tabs still pick and outline one). Bigger comparison and leaders text. */
@media (min-width:700px) and (max-width:900px) and (min-height:960px) and (max-height:1240px) and (orientation:portrait) {
  #app #careerStatistics.careerScreenV10 .phoneSceneArt::after { inset:44% 0 0;background:linear-gradient(180deg,rgba(5,6,8,0) 0%,rgba(5,6,8,.72) 22%,rgba(5,6,8,.94) 40%,rgba(5,6,8,.96) 100%); }
  #app #careerStatistics.careerScreenV10 .phoneHero { top:9%;height:34%; }
  #app #careerStatistics.careerScreenV10 .phoneHeroDaniel { left:3%; }
  #app #careerStatistics.careerScreenV10 .phoneHeroNik { left:auto;right:3%; }
  #app #careerStatistics.careerScreenV10 .phoneFaceBand { inset:0 0 auto;height:42%;background:none; }
  #app #careerStatistics.careerScreenV10 .titleBlock { left:20%;top:16px;width:60%; }
  #app #careerStatistics.careerScreenV10 .titleBlock .sd-tagline { font-size:11px;letter-spacing:.36em; }
  #app #careerStatistics.careerScreenV10 .previewChip { top:16px;left:20px; }
  #app #careerStatistics.careerScreenV10 .phoneHub { left:20px;right:20px;top:38%;bottom:88px;grid-template-rows:96px 44px minmax(0,1fr);gap:10px; }
  #app #careerStatistics.careerScreenV10 .headlineTiles { gap:8px; }
  #app #careerStatistics.careerScreenV10 .headlineTile { grid-template-columns:34px minmax(0,1fr);gap:7px;padding:8px; }
  #app #careerStatistics.careerScreenV10 .headlineIcon { width:32px;height:32px; }
  #app #careerStatistics.careerScreenV10 .headlineIcon img { max-width:32px;max-height:40px; }
  #app #careerStatistics.careerScreenV10 .headlineLabel { font-size:11px;letter-spacing:.06em;line-height:1.15; }
  #app #careerStatistics.careerScreenV10 .headlineTogether { font-size:9px; }
  #app #careerStatistics.careerScreenV10 .headlineNumber { font-size:36px; }
  #app #careerStatistics.careerScreenV10 .headlinePair { gap:4px;margin-top:3px; }
  #app #careerStatistics.careerScreenV10 .headlinePair b { font-size:28px; }
  #app #careerStatistics.careerScreenV10 .headlinePair small { font-size:9px; }
  #app #careerStatistics.careerScreenV10 .phoneTabs label { font-size:14px;letter-spacing:.16em; }
  #app #careerStatistics.careerScreenV10 .contentGrid { display:grid;grid-template-columns:1.2fr 1fr;grid-template-rows:minmax(0,1fr) auto;gap:10px;grid-template-areas:"table compare" "leaders leaders"; }
  #app #careerStatistics.careerScreenV10 .contentGrid>.careerTablePanel { grid-area:table; }
  #app #careerStatistics.careerScreenV10 .contentGrid>.comparisonPanel { grid-area:compare; }
  #app #careerStatistics.careerScreenV10 .contentGrid>.leadersPanel { grid-area:leaders; }
  #app #careerStatistics.careerScreenV10 .contentGrid>.statePanel { grid-area:1/1/3/3; }
  #app #careerStatistics.careerScreenV10 .contentGrid>:is(.careerTablePanel,.comparisonPanel,.leadersPanel) { display:block; }
  #app #careerStatistics.careerScreenV10 #careerPhoneTable:checked~.contentGrid .careerTablePanel,
  #app #careerStatistics.careerScreenV10 #careerPhoneCompare:checked~.contentGrid .comparisonPanel,
  #app #careerStatistics.careerScreenV10 #careerPhoneLeaders:checked~.contentGrid .leadersPanel { border-color:#ffdb69;box-shadow:inset 0 0 14px rgba(230,189,66,.11); }
  #app #careerStatistics.careerScreenV10 .panelTitle { padding:8px 11px 6px;font-size:15px; }
  #app #careerStatistics.careerScreenV10 .careerTable th { padding:6px 2px;font-size:10px;letter-spacing:.02em;white-space:nowrap; }
  #app #careerStatistics.careerScreenV10 .careerTable td { padding:11px 3px;font-size:15px; }
  #app #careerStatistics.careerScreenV10 .comparisonBody { padding:6px 12px; }
  #app #careerStatistics.careerScreenV10 .compareRow { grid-template-columns:48px 1fr 48px;gap:0 6px;padding:3px 0; }
  #app #careerStatistics.careerScreenV10 .compareRow :is(.dValue,.nValue) { font-size:14px; }
  #app #careerStatistics.careerScreenV10 .compareLabel { font-size:11px;white-space:normal; }
  #app #careerStatistics.careerScreenV10 .compareTrack { height:5px;margin-top:3px; }
  #app #careerStatistics.careerScreenV10 .leaderGrid { grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;padding:8px 10px 10px; }
  #app #careerStatistics.careerScreenV10 .leaderCard { height:auto;min-height:84px;grid-template-columns:38px minmax(0,1fr);gap:6px;padding:6px 16px 6px 6px; }
  #app #careerStatistics.careerScreenV10 .managerPortrait { width:36px;height:52px; }
  #app #careerStatistics.careerScreenV10 .leaderLabel { font-size:10px;line-height:1.15; }
  #app #careerStatistics.careerScreenV10 .leaderName { margin-top:3px;font-size:13px; }
  #app #careerStatistics.careerScreenV10 .leaderValue { margin-top:3px;font-size:20px; }
  #app #careerStatistics.careerScreenV10 .actionRow { left:20px;right:20px;bottom:16px;height:56px;gap:10px; }
  /* Tablets in portrait render at 760px wide (js/onlinePlayerIdentity.js sets width=760), so Team V's phone action grid also matches here: one row, in tap order. */
  #app #careerStatistics.careerScreenV10 .actionRow { grid-template-areas:none;grid-template-columns:none;grid-template-rows:56px;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr); }
  #app #careerStatistics.careerScreenV10 .actionRow .actionButton { grid-area:auto;min-height:56px; }
  #app #careerStatistics.careerScreenV10 .actionRow .actionButton { padding:0 14px;grid-template-columns:30px 1fr 14px;gap:8px;font-size:13px; }
  #app #careerStatistics.careerScreenV10 .partialBanner { left:20px;right:20px;top:calc((100% - var(--cs-nav)) * .38 - 36px);width:auto; }
  #app #careerStatistics.careerScreenV10 .statePanel h2 { font-size:24px; }
  #app #careerStatistics.careerScreenV10 .statePanel p { font-size:15px; }
}
/* r78 HO-031 phone marble: phones, sideways phones and upright tablets draw Team V's ENV_STATISTICS_PHONE_V2 (both
   managers painted in) over the whole stage, cover and pinned to the top, in place of the old background and the two
   cut-outs. The dark grades over the men are gone. Title, totals, tabs, panels and buttons are unchanged. */
@media ${CS_PHONE_ART_MEDIA} {
  #app #careerStatistics.careerScreenV10 .phoneBackground img { object-position:center top; }
  #app #careerStatistics.careerScreenV10 .phoneSceneArt::after { content:none; }
  #app #careerStatistics.careerScreenV10 .phoneFaceBand { background:none; }
}
/* HO-033 items 5 and 6 (owner rules HO-027 and HO-028). Phones, sideways phones and upright tablets: the totals tiles, the
   tab strip and the three panels get an opaque black-gold marble face (HO-029 kit tile) instead of the .73-.91 glass the
   managers showed through. */
@media ${CS_PHONE_ART_MEDIA} {
  #app #careerStatistics.careerScreenV10 :is(.glassPanel,.headlineTile,.phoneTabs) {
   background:linear-gradient(145deg,rgba(242,196,91,.05),transparent 46%),var(--r78-panel,#110f0c) url("css/r78-marble-tile.webp") 0 0/256px 256px repeat;
  }
}
/* Upright phones: readable type at the HO-028 sizes (labels 12px and up, table and values 15px; they were 6-9px). The
   totals row grows to hold the bigger labels and the hub starts a little higher (still below the managers' faces), so the
   picked panel keeps its room; the table headers may wrap to two lines. */
@media (max-width:760px) and (orientation:portrait) {
  #app #careerStatistics.careerScreenV10 .phoneHub { grid-template-rows:clamp(90px,14svh,104px) 44px minmax(0,1fr); }
  #app #careerStatistics.careerScreenV10 .headlineTile { grid-template-columns:minmax(0,1fr);padding:4px 7px; }
  #app #careerStatistics.careerScreenV10 .headlineIcon { display:none; }
  #app #careerStatistics.careerScreenV10 .headlineLabel { font-size:12px;letter-spacing:.03em;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
  #app #careerStatistics.careerScreenV10 :is(.headlineTogether,.headlinePair small) { font-size:12px;letter-spacing:.04em; }
  #app #careerStatistics.careerScreenV10 .phoneTabs label { font-size:13px; }
  #app #careerStatistics.careerScreenV10 .panelTitle { padding:5px 8px 4px;font-size:13px; }
  #app #careerStatistics.careerScreenV10 .careerTable th { padding:3px 1px;font-size:12px;line-height:1.1;letter-spacing:0;white-space:nowrap; }
  #app #careerStatistics.careerScreenV10 .careerTable th:nth-child(1) { width:7%; }
  #app #careerStatistics.careerScreenV10 .careerTable th:nth-child(2) { width:22%; }
  #app #careerStatistics.careerScreenV10 .careerTable th:nth-child(3) { width:19%; }
  #app #careerStatistics.careerScreenV10 .careerTable th:nth-child(4) { width:22%; }
  #app #careerStatistics.careerScreenV10 .careerTable th:nth-child(5) { width:14%; }
  #app #careerStatistics.careerScreenV10 .careerTable td { padding:6px 2px;font-size:15px; }
  #app #careerStatistics.careerScreenV10 .rankCrown { font-size:15px; }
  #app #careerStatistics.careerScreenV10 .compareRow :is(.dValue,.nValue) { font-size:15px; }
  #app #careerStatistics.careerScreenV10 .compareLabel { font-size:12px; }
  #app #careerStatistics.careerScreenV10 .leaderLabel { font-size:12px;line-height:1.1; }
  #app #careerStatistics.careerScreenV10 .leaderName { font-size:15px; }
  #app #careerStatistics.careerScreenV10 .leaderValue { font-size:18px; }
  #app #careerStatistics.careerScreenV10 .actionRow .actionButton { font-size:13px; }
}
/* Short upright phones (660px tall and less): the bigger type needs about 50px more for the six comparison rows, so the hub
   starts just under the managers' faces (the plate is drawn cover from the top: faces end at 25.31% of its height, Team V
   PHONE_FACE_ZONES), and a panel that still runs long scrolls inside itself instead of being cut. */
@media (max-width:760px) and (orientation:portrait) and (max-height:700px) {
  #app #careerStatistics.careerScreenV10 { --cs-face-bottom:calc(max(100vw * 2096 / 1179, 100svh) * .2531); }
  #app #careerStatistics.careerScreenV10 .phoneHub { top:calc(var(--cs-face-bottom) + 12px); }
  #app #careerStatistics.careerScreenV10 .careerStage[data-state="partial"] .phoneHub { top:calc(var(--cs-face-bottom) + 52px); }
  #app #careerStatistics.careerScreenV10 .partialBanner { top:calc(var(--cs-face-bottom) + 10px); }
  #app #careerStatistics.careerScreenV10 .contentGrid>:is(.careerTablePanel,.comparisonPanel,.leadersPanel) { overflow-y:auto;overscroll-behavior:contain; }
}
/* Sideways phones (852x393): the upright plate ran the full width, so Nik's face sat behind the Career Table panel and
   Daniel's head was a big crop. The plate now fills only the left band under the title (the hub owns the right side),
   shown from the top so both managers stand side by side below the title and no panel covers a face. */
@media (min-width:640px) and (max-width:880px) and (min-height:340px) and (max-height:410px) and (orientation:landscape) {
  #app #careerStatistics.careerScreenV10 .phoneSceneArt { background:#090a0c; }
  #app #careerStatistics.careerScreenV10 .phoneBackground { right:auto;width:44%;bottom:var(--cs-nav); }
  #app #careerStatistics.careerScreenV10 .phoneBackground img { object-fit:cover;object-position:50% 0; }
  #app #careerStatistics.careerScreenV10 .titleBlock { top:4px; }
  /* HO-033 follow-up: no dark wash over the right side (owner rule: no dimming); the hub's panels are opaque marble. */
  #app #careerStatistics.careerScreenV10 .phoneSceneArt::after { content:none; }
  /* HO-028 type on sideways phones too: labels 12px or more, values and secondary text 15px. The four totals keep one row
     (labels wrap to two lines instead of shrinking); the tabs, table, comparison, leaders and actions grow in place, and
     every tab still fits its panel without scrolling at 852x393. The hub stays right of the managers (no face covered). */
  #app #careerStatistics.careerScreenV10 .phoneHub { grid-template-rows:58px 40px minmax(0,1fr); }
  #app #careerStatistics.careerScreenV10 .headlineTile { padding:1px 6px;align-content:center; }
  #app #careerStatistics.careerScreenV10 .headlineLabel { font-size:12px;line-height:1.05;letter-spacing:.03em;white-space:normal;overflow:visible; }
  #app #careerStatistics.careerScreenV10 .headlineTogether,
  #app #careerStatistics.careerScreenV10 .headlinePair small { font-size:12px; }
  #app #careerStatistics.careerScreenV10 .headlineNumber { font-size:20px; }
  #app #careerStatistics.careerScreenV10 .headlinePair b { font-size:17px; }
  #app #careerStatistics.careerScreenV10 .phoneTabs label { font-size:13px; }
  #app #careerStatistics.careerScreenV10 .panelTitle { padding:4px 8px 3px;font-size:13px; }
  #app #careerStatistics.careerScreenV10 .careerTable th { padding:3px 3px;font-size:12px;letter-spacing:.02em;white-space:nowrap; }
  #app #careerStatistics.careerScreenV10 .careerTable td { padding:5px 3px;font-size:15px; }
  #app #careerStatistics.careerScreenV10 .careerTable .rankCrown { font-size:15px; }
  #app #careerStatistics.careerScreenV10 .compareRow { grid-template-columns:44px 1fr 44px; }
  #app #careerStatistics.careerScreenV10 .compareRow :is(.dValue,.nValue) { font-size:15px; }
  #app #careerStatistics.careerScreenV10 .compareLabel { font-size:12px; }
  #app #careerStatistics.careerScreenV10 .leaderCard { min-height:48px;grid-template-columns:24px minmax(0,1fr); }
  #app #careerStatistics.careerScreenV10 .leaderLabel { font-size:12px; }
  #app #careerStatistics.careerScreenV10 .leaderName { font-size:15px; }
  #app #careerStatistics.careerScreenV10 .leaderValue { font-size:18px; }
  #app #careerStatistics.careerScreenV10 .actionRow { grid-template-columns:1.3fr 1.1fr 1fr; }
  #app #careerStatistics.careerScreenV10 .actionRow .actionButton { font-size:13px;line-height:1.05; }
  #app #careerStatistics.careerScreenV10 .statePanel p { font-size:15px; }
}
/* Shorter sideways phones (740x360): the same sizes, with tighter rows so Compare and Leaders still fit their panel. */
@media (min-width:640px) and (max-width:880px) and (min-height:340px) and (max-height:375px) and (orientation:landscape) {
  #app #careerStatistics.careerScreenV10 .phoneHub { grid-template-rows:58px 36px minmax(0,1fr);gap:4px; }
  #app #careerStatistics.careerScreenV10 .panelTitle { padding:2px 8px 1px; }
  #app #careerStatistics.careerScreenV10 .compareRow :is(.dValue,.nValue,.compareLabel) { line-height:1; }
  #app #careerStatistics.careerScreenV10 .compareTrack { margin-top:0; }
  #app #careerStatistics.careerScreenV10 .leaderGrid { gap:3px;padding:2px 6px 3px; }
  #app #careerStatistics.careerScreenV10 .leaderCard { min-height:0;padding-block:1px; }
  #app #careerStatistics.careerScreenV10 .leaderCard :is(.leaderLabel,.leaderName,.leaderValue) { line-height:1.05;margin-top:0; }
  #app #careerStatistics.careerScreenV10 .actionRow { grid-template-columns:1.2fr 1.05fr 1.05fr;gap:5px; }
  #app #careerStatistics.careerScreenV10 .actionRow .actionButton { padding:0 5px;gap:4px;font-size:12px;letter-spacing:.02em; }
}
/* r80 Europa League: Manager Comparison has seven rows (EUROPA LEAGUE WINS). Below the 1200x700 desktop (css/v10Shell.css already
   spreads the rows over its fixed panel) Team V's panel is a fixed height with 3px-padded rows, and the seventh row hung out of
   it. Here the rows share the panel's height the same way, and on short windows the panel takes the free band above the
   leaders (it ends at 72.45%, the leaders start at 73.5%). */
@media (min-width:901px) and (min-height:481px) and (max-height:699px), (min-width:901px) and (max-width:1199px) and (min-height:481px) {
  #app #careerStatistics.careerScreenV10 .comparisonPanel:not([hidden]) { display:flex;flex-direction:column; }
  #app #careerStatistics.careerScreenV10 .comparisonBody { flex:1 1 auto;min-height:0;display:flex;flex-direction:column;justify-content:space-between;padding:3px 12px 5px; }
  #app #careerStatistics.careerScreenV10 .compareRow { padding:0; }
  #app #careerStatistics.careerScreenV10 .compareTrack { margin-top:2px;height:4px; }
}
/* Short upright phones: the seven rows fit the Compare panel (no inner scroll, nothing cut) with the HO-028 type kept; the bar
   sits right under its numbers. */
@media (max-width:760px) and (orientation:portrait) and (max-height:700px) {
  #app #careerStatistics.careerScreenV10 .comparisonPanel .panelTitle { padding:4px 8px 3px; }
  #app #careerStatistics.careerScreenV10 .compareRow { padding:0; }
  #app #careerStatistics.careerScreenV10 .compareTrack { margin-top:0; }
}
@media (min-width:640px) and (max-width:880px) and (min-height:340px) and (max-height:410px) and (orientation:landscape) {
  #app #careerStatistics.careerScreenV10 .compareRow { padding:0; }
  #app #careerStatistics.careerScreenV10 .compareTrack { margin-top:0; }
}
/* r80 short screens: narrow tall phones (360x740): the hub starts at 41% and left the Compare panel 136px, so AVERAGE LEAGUE
   POINTS and AVERAGE LEAGUE GOALS ran under CURRENT RIVALRY STATISTICS / BACK TO MAIN MENU. The rows take the short-phone
   spacing above and the hub starts 2.5% higher (it stays clear of both faces), so the seven rows fit the panel. */
@media (max-width:370px) and (orientation:portrait) and (min-height:701px) and (max-height:800px) {
  #app #careerStatistics.careerScreenV10 .phoneHub { top:38.5%; }
  #app #careerStatistics.careerScreenV10 .partialBanner { top:calc((100% - 56px - env(safe-area-inset-bottom)) * .385 - 27px); }
  #app #careerStatistics.careerScreenV10 .comparisonPanel .panelTitle { padding:4px 8px 3px; }
  #app #careerStatistics.careerScreenV10 .compareRow { padding:0; }
  #app #careerStatistics.careerScreenV10 .compareTrack { margin-top:0; }
}
/* Shorter sideways phones (740x360): the Compare tab already names the panel, so its heading is kept for screen readers only
   and the seven rows take its place. */
@media (min-width:640px) and (max-width:880px) and (min-height:340px) and (max-height:375px) and (orientation:landscape) {
  #app #careerStatistics.careerScreenV10 .comparisonPanel .panelTitle { position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0; }
  #app #careerStatistics.careerScreenV10 .comparisonBody { padding:2px 9px 1px; }
}
@media (min-width:901px) and (min-height:481px) and (max-height:699px) {
  #app #careerStatistics.careerScreenV10 .comparisonPanel { height:31%; }
  #app #careerStatistics.careerScreenV10 .careerStage[data-state="partial"] .comparisonPanel { height:28.6%; }
}
`;

  // TROPHY-PLATE-V2 (ticket 1610P): desktop Trophy Room on Team V's black-marble trophy-hall plate
  // (visual-assets/v10_1/plates-v2/ENV_TROPHY_ROOM_PLATE_V2_*), drawn to match NEXT_TROPHY_ROOM. Strictly the desktop picture
  // range: wide landscape windows of at least 1200x600; phones, sideways phones and tablets keep their art and rules.
  // Team V's stage still draws the old plate on .sd-stage__plate; the adapter re-points that plane at the V2 files (height-fit,
  // centred, top-anchored, with a soft darkened side fill on windows wider than 16:9), so the 2X swap and load timing are
  // unchanged and the plate loads with this screen, never with the startup bundle. The plate carries both managers, all
  // banners and the name tags, and an empty marble pedestal with a flat top: the live champion trophy is seated on it and its
  // name and counts are written on the pedestal's face. Everything is placed in plate units (--tr-k = one plate pixel), so it
  // stays registered on every window shape. Looks only: every word, id and tap order stays as it was.
  const TROPHY_PLATE_V2_CSS=String.raw`
@media (min-width:1200px) and (min-height:600px) and (min-aspect-ratio:3/2) and (orientation:landscape) {
  #app #trophyRoom {
    --tr-k:calc(100svh / 864);
    --tr-bevel:linear-gradient(135deg,#fff1b8 0%,#e8b94a 15%,#8a6a12 36%,#f2c45b 56%,#fff1b8 73%,#b8862a 100%);
    --tr-gold:linear-gradient(180deg,#fff0a6 0,#f8d764 20%,#e4b032 54%,#f4cf58 80%,#c98f1c 100%);
  }
  #app #trophyRoom .sd-stage__layer--plate {overflow:hidden}
  #app #trophyRoom .sd-stage__layer--plate::before {
    content:"";position:absolute;inset:-4%;pointer-events:none;filter:blur(16px) brightness(.5) saturate(.9);
    background:#07080a image-set(url('visual-assets/v10_1/plates-v2/ENV_TROPHY_ROOM_PLATE_V2_1X.webp') 1x,url('visual-assets/v10_1/plates-v2/ENV_TROPHY_ROOM_PLATE_V2_2X.webp') 2x) center / cover no-repeat;
  }
  #app #trophyRoom .sd-stage__layer--plate > .sd-stage__registered {
    left:50%;top:0;width:calc(1536 * var(--tr-k));height:calc(864 * var(--tr-k));transform:translateX(-50%) translateZ(0);
    -webkit-mask-image:linear-gradient(90deg,transparent 0,#000 5%,#000 95%,transparent 100%);mask-image:linear-gradient(90deg,transparent 0,#000 5%,#000 95%,transparent 100%);
  }
  #app #trophyRoom .sd-stage__plate {
    background-image:image-set(url('visual-assets/v10_1/plates-v2/ENV_TROPHY_ROOM_PLATE_V2_1X.webp') 1x,url('visual-assets/v10_1/plates-v2/ENV_TROPHY_ROOM_PLATE_V2_2X.webp') 2x);
  }
  /* the title sits on dark marble; the brush image's black box melts into the plate */
  #app #trophyRoom .trophyBrushTitle {mix-blend-mode:screen}
  /* the plate already carries the crown over the kicker, so the live one keeps its space but is not drawn twice */
  #app #trophyRoom .trophyEyebrow::before {visibility:hidden}
  #app #trophyRoom .trophyEyebrow,
  #app #trophyRoom .trophyTagline {color:#fff6d8;text-shadow:0 1px 3px #000,0 0 10px #000c}
  /* the champion trophy stands on the plate's pedestal (flat top at plate y 450); its name and line are on the pedestal face */
  #app #trophyRoom .heroCeremony {left:calc(50vw - 195 * var(--tr-k));top:calc(225 * var(--tr-k));width:calc(390 * var(--tr-k));height:calc(310 * var(--tr-k))}
  #app #trophyRoom .heroTrophyPicture {left:calc(195 * var(--tr-k) - 90 * var(--tr-k));top:0;width:calc(180 * var(--tr-k));height:calc(243 * var(--tr-k))}
  #app #trophyRoom .heroReflection {display:none}
  #app #trophyRoom .heroPlinth {
    left:0;right:0;top:calc(250 * var(--tr-k));bottom:auto;height:calc(64 * var(--tr-k));clip-path:none;border:0;
    background:none;box-shadow:none;
  }
  #app #trophyRoom .heroPlinth::after {display:none}
  #app #trophyRoom .heroPlinth span {font-size:max(12px,calc(16 * var(--tr-k)));text-shadow:0 1px 2px #000,0 0 10px #000a}
  #app #trophyRoom .heroPlinth small {font-size:max(8px,calc(8 * var(--tr-k)));color:#d8c68f}
  /* the two rank cards, the tab row and the cases sit as in the picture */
  #app #trophyRoom .careerRank {
    border:2px solid transparent;border-radius:2px;
    /* HO-033 follow-up: opaque black-gold marble (HO-029 kit tile), not the .90-.95 see-through glass (owner rule HO-027) */
    background:linear-gradient(180deg,#f2c45b0d,transparent 42%) padding-box,url("css/r78-marble-tile.webp") 0 0/256px 256px repeat padding-box,var(--tr-bevel) border-box #110f0c;
    box-shadow:inset 0 0 0 1px #000a,0 6px 18px #000a;
  }
  /* tabs: black with a gold edge, ALL in polished gold (HO-033 follow-up: solid black, no longer 90%) */
  #app #trophyRoom .trophyTabs {background:#050506;border:1px solid #d9aa3caa;box-shadow:0 8px 22px #0009}
  #app #trophyRoom .trophyTab {background:linear-gradient(180deg,#141412,#060607);color:#f6efd8;box-shadow:inset 0 1px 0 #fff1b814}
  #app #trophyRoom .trophyTab.is-active {
    background:var(--tr-gold);color:#1a1305;text-shadow:0 1px 0 #fff2b588;
    box-shadow:inset 0 1px 0 #fffbe0,inset 0 -3px 0 #a87a1288,0 0 16px #f5c51838;
  }
  /* the cases: gold-bevel frame around black marble glass */
  #app #trophyRoom .shelfGlass {
    border:clamp(3px,.4vh,4px) solid transparent;border-radius:0;
    background:linear-gradient(180deg,#f2c45b0d,transparent 42%) padding-box,url("css/r78-marble-tile.webp") 0 0/256px 256px repeat padding-box,var(--tr-bevel) border-box #110f0c;
    box-shadow:inset 0 0 0 2px #050505,0 14px 34px #000b,0 0 22px #f0c84b26;
  }
  #app #trophyRoom .trophyCard {
    border:1px solid #d9aa3c99;border-radius:0;
    background:radial-gradient(ellipse at 50% 12%,#a07d3a52,transparent 62%),linear-gradient(180deg,#1a1812cc,#060607f2);
    box-shadow:inset 0 0 0 1px #000a,inset 0 1px 0 2px #fff1b812;
  }
  #app #trophyRoom .recordRibbon {border:1px solid #d9aa3c99;background:linear-gradient(180deg,#0e0e0fe6,#050506f2);box-shadow:inset 0 0 0 1px #000a}
  /* BACK: black with the gold-bevel edge, as in the picture */
  #app #trophyRoom .trophyBack {
    border:3px solid transparent;border-radius:4px;color:#fff1ae;
    background:linear-gradient(180deg,#171512,#070708) padding-box,var(--tr-bevel) border-box;
    box-shadow:inset 0 0 0 1px #050505,inset 0 1px 0 2px #fff1b81f,0 6px 18px #000b,0 0 18px #f0c84b30;
  }
}
/* Tall windows seat the tab row, cases and rank cards exactly where the picture has them (plate y 540 and 465). Short windows
   (1280x650, 1366x768) keep the live rows, which already fit one screen with BACK, and lift the pedestal text a little. */
@media (min-width:1200px) and (min-height:821px) and (min-aspect-ratio:3/2) and (orientation:landscape) {
  #app #trophyRoom .trophyRoomContent.sd-stage__ui-content {padding-top:calc(540 * var(--tr-k))}
  #app #trophyRoom .careerRanks {top:calc(465 * var(--tr-k))}
  #app #trophyRoom .careerRank {top:0;bottom:auto}
}
@media (min-width:1200px) and (min-height:600px) and (max-height:820px) and (min-aspect-ratio:3/2) and (orientation:landscape) {
  #app #trophyRoom .heroPlinth {top:calc(229 * var(--tr-k))}
}
`;

  const TROPHY_SIDEWAYS_1730_CSS=String.raw`
  /* JOB-1730: adopted study 1730 (sideways phones, 844x390 and 740x360). Left stage: title, Daniel LEFT, Nik RIGHT and the
     champion trophy between them. Right cabinet: six tabs in one row, then the five trophy cases in one row (r80 Europa League). BACK (wide)
     and MORE sit in their own full-width row above a slimmer hub bar, clear of every tab and card. main is the only scroller. */
  @media (max-height:480px) and (orientation:landscape) {
    html[data-v10-screen="trophyRoom"] { --sd-nav-bottom-h:48px; }
    html[data-v10-screen="trophyRoom"] .sd-nav-bottom .sd-nav-tab { gap:2px; font-size:9.5px; letter-spacing:.1em; }
    html[data-v10-screen="trophyRoom"] .sd-nav-bottom .sd-nav-tab svg { width:18px; height:18px; }
    #app #trophyRoom {
      --tr-act:44px; --tr-gap:6px;
      --tr-lcol:max(236px,34vw);
      /* r80 short screens: 78px cut TWO MANAGERS. ONE LEGACY. under the wordmark at 844x390 (it started at 80px); the
         champion trophy keeps its size and place (it stands on the stage's floor). */
      --tr-title:88px;
      --tr-areab:calc(100svh - var(--tr-hub) - var(--tr-act) - 2 * var(--tr-gap));
      --tr-areah:calc(var(--tr-areab) - 4px);
      --tr-stage:calc(var(--tr-lcol) - 12px);
      --tr-hero-top:calc(4px + var(--tr-title) + 2px);
      --tr-row:calc(var(--tr-areah) - 44px - var(--tr-gap) - 12px);
    }
    #app #trophyRoom .trophyPhoneBackdrop img { object-position:50% 38%; }
    #app #trophyRoom .trophyPhoneArtShade { background:linear-gradient(180deg,#02030426,#02030473 55%,#050607); }
    #app #trophyRoom .trophyPhoneHero {
      top:auto; bottom:calc(var(--tr-hub) + var(--tr-act) + 2 * var(--tr-gap) - var(--tr-hub));
      height:calc(var(--tr-areab) - var(--tr-hero-top)); width:calc(var(--tr-stage) / 2);
    }
    #app #trophyRoom .trophyPhoneHero img { object-fit:contain; }
    #app #trophyRoom .trophyPhoneHero--daniel { left:8px; right:auto; }
    #app #trophyRoom .trophyPhoneHero--daniel img { object-position:left bottom; }
    #app #trophyRoom .trophyPhoneHero--nik { left:calc(8px + var(--tr-stage) / 2); right:auto; }
    #app #trophyRoom .trophyPhoneHero--nik img { object-position:right bottom; }
    #app #trophyRoom .trophyRoomContent.sd-stage__ui-content {
      display:block; min-height:100svh; background:none;
      padding:4px 8px 0 calc(var(--tr-lcol) + 4px);
    }
    #app #trophyRoom .trophyTitleBlock { inset:4px auto auto 8px; width:var(--tr-stage); height:var(--tr-title); text-align:center; }
    #app #trophyRoom .trophyEyebrow { font-size:8px; line-height:1.2; letter-spacing:.22em; }
    #app #trophyRoom .trophyBrushTitle { width:min(100%,240px); height:auto; max-height:44px; margin:2px auto 0; display:block; }
    #app #trophyRoom .trophyTagline { margin:2px 0 0; font-size:7px; line-height:1.2; letter-spacing:.14em; }
    #app #trophyRoom .heroCeremony {
      inset:var(--tr-hero-top) auto auto calc(8px + var(--tr-stage) / 4);
      width:calc(var(--tr-stage) / 2); height:calc(var(--tr-areab) - var(--tr-hero-top));
    }
    #app #trophyRoom .heroSpotlight { inset:0 -20% 20px; }
    #app #trophyRoom .heroReflection { display:none; }
    #app #trophyRoom .heroTrophyPicture { left:0; top:auto; bottom:23px; width:100%; height:min(112px,calc(100% - 23px)); }
    #app #trophyRoom .heroTrophyPicture img { width:100%; height:100%; object-fit:contain; object-position:center bottom; }
    #app #trophyRoom .heroPlinth {
      left:-11%; right:-11%; bottom:0; height:auto; min-height:0; padding:4px 2px 3px; text-align:center;
      background:linear-gradient(180deg,#31260d,#070807); border:1px solid #b99549;
      clip-path:polygon(7% 0,93% 0,100% 18%,100% 100%,0 100%,0 18%);
    }
    #app #trophyRoom .heroPlinth span { display:block; font-size:10px; line-height:1; letter-spacing:.08em; white-space:nowrap; }
    #app #trophyRoom .heroPlinth small { display:block; margin-top:2px; font-size:6.5px; line-height:1; letter-spacing:.12em; }
    #app #trophyRoom .trophyShelf {
      display:grid; grid-template-columns:minmax(0,1fr); grid-template-rows:44px minmax(0,1fr); grid-auto-flow:row; gap:var(--tr-gap);
      height:var(--tr-areah); min-height:0; padding:0; border:0; background:none;
    }
    #app #trophyRoom .trophyTabs {
      display:grid; grid-template-columns:repeat(6,minmax(0,1fr)); gap:3px; min-height:44px; height:44px;
      width:auto; margin:0 50px 0 0; padding:0; border:0; background:none;
    }
    #app #trophyRoom .trophyTab,
    #app #trophyRoom .trophyTab:nth-child(n+4) {
      grid-column:auto; min-width:0; min-height:44px; height:44px; padding:0 4px;
      font-size:10px; line-height:1.1; letter-spacing:.07em; white-space:normal; overflow-wrap:normal; word-break:normal;
    }
    #app #trophyRoom .shelfGlass {
      display:flex; flex-direction:column; height:100%; min-height:0; padding:5px; border:1px solid #d4a017b3; overflow:hidden;
      background:linear-gradient(180deg,#0f0e0cd6,#050607f0);
    }
    #app #trophyRoom .trophyGrid {
      flex:1 1 0; height:auto; min-height:0; grid-template-columns:repeat(5,minmax(0,1fr)); grid-template-rows:minmax(0,1fr);
      grid-auto-rows:auto; gap:5px; overflow:hidden;
    }
    #app #trophyRoom .trophyShelf.is-filtered .trophyGrid {
      grid-template-columns:minmax(0,230px); grid-template-rows:minmax(0,1fr); grid-auto-rows:auto; justify-content:center;
    }
    #app #trophyRoom .trophyCard {
      grid-template-rows:minmax(0,1fr) auto auto 12px; height:100%; min-height:0; padding:4px 3px 3px; overflow:hidden; text-align:center;
    }
    #app #trophyRoom .trophyCardPicture,
    #app #trophyRoom .trophyShelf.is-filtered .trophyCardPicture { width:100%; height:100%; min-height:0; }
    #app #trophyRoom .trophyCardPicture img { display:block; width:100%; height:100%; min-height:0; object-fit:contain; }
    #app #trophyRoom .trophyCard h3 {
      display:grid; align-items:center; min-height:25px; margin:0; padding:3px 0 2px; font-size:10.5px; line-height:1.05; letter-spacing:.06em;
      border-top:1px solid #79612ecc; border-bottom:0; text-wrap:balance;
    }
    #app #trophyRoom .managerCounts { min-height:0; gap:0; }
    #app #trophyRoom .managerCounts span { font-size:8px; line-height:1.2; letter-spacing:.1em; }
    #app #trophyRoom .managerCounts strong { font-size:16px; line-height:1.05; }
    #app #trophyRoom .notWonYet { min-height:12px; margin:0; font-size:8px; line-height:12px; }
    #app #trophyRoom .trophyBack {
      left:8px; right:calc(8px + 96px + 8px); bottom:calc(var(--tr-hub) + var(--tr-gap)); height:44px; min-height:44px;
      font-size:14px; letter-spacing:.24em;
    }
    #app #trophyRoom .trophyPhoneMoreButton {
      right:8px; bottom:calc(var(--tr-hub) + var(--tr-gap)); width:96px; height:44px; font-size:11px; letter-spacing:.14em;
    }
    #app #trophyRoom .phoneMoreToggle { right:8px!important; bottom:calc(var(--tr-hub) + var(--tr-gap))!important; width:96px!important; height:44px!important; }
    #app #trophyRoom .phoneMoreToggle:checked ~ .trophyPhoneSheet.sd-sheet { inset:4px 54px auto calc(var(--tr-lcol) + 4px); height:36px; padding:2px 8px; background:linear-gradient(180deg,#050607f0,#050607b8); }
    #app #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .heroCeremony { visibility:visible; }
    #app #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .trophyShelf { display:block; height:auto; }
    #app #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .shelfGlass { display:block; height:auto; overflow:visible; padding:0; border:0; background:none; }
    #app #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .careerRanks { margin:44px 0 6px; }
    #app #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .careerRank { min-height:58px; padding:4px 5px; }
    #app #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .recordRibbon { gap:4px; padding:5px; }
    #app #trophyRoom .phoneMoreToggle:checked ~ #trophyRoomContent .recordItem { min-height:40px; padding:3px 6px; }
  }
  @media (max-height:375px) and (orientation:landscape) {
    html[data-v10-screen="trophyRoom"] { --sd-nav-bottom-h:44px; }
    html[data-v10-screen="trophyRoom"] .sd-nav-bottom .sd-nav-tab svg { width:16px; height:16px; }
    #app #trophyRoom { --tr-gap:5px; --tr-title:70px; }
    #app #trophyRoom .trophyBrushTitle { max-height:38px; }
    #app #trophyRoom .trophyCard h3 { font-size:10px; }
    #app #trophyRoom .managerCounts strong { font-size:14px; }
    #app #trophyRoom .trophyTab { font-size:9.5px; }
  }
  `;
  
  // r84 Golden Showdown looks: the shared gold tokens and the r78 black-and-gold marble tile. Nothing here dims, overlays or moves
  // another element. Trophy Room: the gold case is a sixth case on the ALL shelf, so rows that held five cases hold six; portrait
  // phones and tablets (three across, the last two centred) show two full rows of three. Career Statistics: one gold line under the
  // Career Table.
  const GOLDEN_SHOWDOWN_CSS=String.raw`
#app #trophyRoom .trophyShelf.has-golden:not(.is-filtered) .trophyGrid {grid-template-columns:repeat(6,minmax(0,1fr))}
@media (max-width:900px) and (orientation:portrait) {
  #app #trophyRoom .trophyShelf.has-golden:not(.is-filtered) .trophyCard:nth-child(4) {grid-column:span 2}
}
#app #trophyRoom .trophyCard.trophyCard--golden {
  border:1px solid var(--sd-gold-500,#f5c518);
  background:radial-gradient(ellipse at 50% 30%,rgba(255,211,77,.30),rgba(255,211,77,0) 62%),linear-gradient(180deg,rgba(73,55,8,.55),rgba(7,8,10,.35)),#0d0c0a url("css/r78-marble-tile.webp") 0 0/256px 256px repeat;
  box-shadow:inset 0 0 0 2px rgba(17,15,12,.9),inset 0 0 0 3px rgba(255,211,77,.55),inset 0 0 22px rgba(242,196,91,.28);
}
#app #trophyRoom .trophyCard--golden .trophyCardPicture img {filter:drop-shadow(0 0 10px rgba(255,211,77,.65)) drop-shadow(0 5px 8px rgba(0,0,0,.72)) saturate(1.2) brightness(1.08)}
#app #trophyRoom .trophyCard--golden h3 {color:var(--sd-gold-300,#ffd34d);text-shadow:0 1px 2px #000}
#app #trophyRoom .trophyCard--golden .managerCounts strong {color:var(--sd-gold-200,#fff1b8)}
#app #careerStatistics .goldenShowdownNote {
  display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:4px 10px;margin:8px 0 0;padding:6px 10px;
  color:var(--sd-gold-200,#fff1b8);font-family:var(--sd-font-condensed,"Barlow Condensed",Arial,sans-serif);font-weight:600;
  font-size:12px;line-height:1.2;letter-spacing:.06em;text-align:center;
  border:1px solid var(--sd-gold-600,#e0ae3a);border-radius:var(--sd-radius,3px);
  background:linear-gradient(180deg,rgba(73,55,8,.6),rgba(13,12,10,.75)),#0d0c0a url("css/r78-marble-tile.webp") 0 0/256px 256px repeat;
  box-shadow:inset 0 0 0 2px rgba(17,15,12,.9),inset 0 0 0 3px rgba(255,211,77,.4);
}
#app #careerStatistics .goldenShowdownNote img {width:20px;height:20px;object-fit:contain;filter:drop-shadow(0 0 6px rgba(255,211,77,.6))}
#app #careerStatistics .goldenShowdownNote strong {color:var(--sd-gold-300,#ffd34d);letter-spacing:.1em}
`;
  function v10Markup(screen){
    const cs=BASE+"career-statistics/",tr=BASE+"trophy-room/";
    if(screen==="careerStatistics")return `<div id="stage-root" class="careerStage" data-primary="trophyRoomButton"><div class="scene sd-stage" id="careerScene" data-plate-width="1672" data-plate-height="941"><div class="sd-stage__layer sd-stage__layer--plate" aria-hidden="true"><div class="sd-stage__registered"><div class="sd-stage__plate"></div><span class="managerMarker managerDaniel" data-manager="daniel" role="presentation"></span><span class="managerMarker managerNik" data-manager="nik" role="presentation"></span></div></div><div class="sd-stage__layer sd-stage__layer--atmosphere" aria-hidden="true"></div><div class="phoneSceneArt" aria-hidden="true"><picture class="phoneBackground"><source media="${CS_PHONE_ART_MEDIA}" srcset="${BASE}plates-v2/ENV_STATISTICS_PHONE_V2.webp"><img alt="" decoding="async"></picture></div><div class="sd-stage__layer sd-stage__layer--ui"><div class="stateBackdrop" aria-hidden="true"></div><div class="careerScreen" aria-labelledby="careerStatisticsScreenTitle"><section class="phoneFaceBand" aria-label="Career Statistics presentation"><header class="titleBlock"><p class="sd-eyebrow">CAREER MODE SHOWDOWN 17</p><h2 id="careerStatisticsScreenTitle" class="titleWordmark" data-sd-enter="title" tabindex="-1" data-route-focus-target="true"><span class="sd-visually-hidden">CAREER STATISTICS</span><img src="${cs}assets/TITLE_CS_V1.webp" alt="" aria-hidden="true" width="1216" height="126" decoding="async"></h2><p class="sd-tagline">TWO MANAGERS. ONE LEGACY.</p></header></section><div id="previewChip" class="previewChip" hidden></div><section class="phoneHub" aria-label="Career Statistics data"><section id="headlineTiles" class="headlineTiles" aria-label="Career headline totals"></section><input class="phoneTabControl" type="radio" name="careerPhoneTab" id="careerPhoneTable" aria-label="Career Table" aria-controls="careerTablePanel" checked><input class="phoneTabControl" type="radio" name="careerPhoneTab" id="careerPhoneCompare" aria-label="Manager Comparison" aria-controls="comparisonPanel"><input class="phoneTabControl" type="radio" name="careerPhoneTab" id="careerPhoneLeaders" aria-label="Career Leaders" aria-controls="leadersPanel"><div class="phoneTabs" aria-label="Career Statistics sections"><label for="careerPhoneTable">TABLE</label><label for="careerPhoneCompare">COMPARE</label><label for="careerPhoneLeaders">LEADERS</label></div><section id="careerStatisticsContent" class="contentGrid" aria-live="polite"><section id="careerTablePanel" data-sd-enter="panel" class="glassPanel careerTablePanel" aria-labelledby="careerTableHeading"></section><section id="comparisonPanel" data-sd-enter="panel" class="glassPanel comparisonPanel" aria-labelledby="comparisonHeading"></section><section id="leadersPanel" data-sd-enter="panel" class="glassPanel leadersPanel" aria-labelledby="leadersHeading"></section><section id="statePanel" class="glassPanel statePanel" hidden></section></section></section><nav class="actionRow" aria-label="Career Statistics actions" data-phone-primary="trophyRoomButton"><button id="careerStatisticsRivalryButton" class="actionButton secondary" type="button"><span class="buttonIcon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 19h3V9H4v10Zm6 0h3V5h-3v14Zm6 0h3V12h-3v7Z"/></svg></span><span class="actionLabel">CURRENT RIVALRY STATISTICS</span><span aria-hidden="true">›</span></button><button id="trophyRoomButton" data-sd-enter="button" class="actionButton primary" type="button"><img src="${BASE}shared/trophies/TRO_SHOWDOWN_CHAMPION_V1_512.webp" alt="" aria-hidden="true"><span class="actionLabel">OPEN TROPHY ROOM</span><span aria-hidden="true">›</span></button><button class="actionButton secondary backButton" type="button"><span class="buttonIcon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m3 11 9-8 9 8v10h-6v-6H9v6H3V11Z"/></svg></span><span class="actionLabel">BACK TO MAIN MENU</span><span aria-hidden="true">›</span></button></nav></div><div class="gridOverlay" aria-hidden="true"></div></div><div class="sd-stage__layer sd-stage__layer--cutout" aria-hidden="true"><div class="sd-stage__registered"><span class="contactShadow"></span><div class="sd-stage__cutout armCutout" data-src1x="${cs}assets/OVL_CS_DANIEL_CROSSED_ARMS_V1_1X.webp" data-src2x="${cs}assets/OVL_CS_DANIEL_CROSSED_ARMS_V1_2X.webp"></div></div></div><div class="sd-stage__layer sd-stage__layer--light" aria-hidden="true"><div class="sd-stage__registered"><span class="sd-stage__rim armRim" data-src1x="${cs}assets/OVL_CS_DANIEL_CROSSED_ARMS_V1_RIM_1X.webp" data-src2x="${cs}assets/OVL_CS_DANIEL_CROSSED_ARMS_V1_RIM_2X.webp"></span></div></div></div></div>`;
    return `<div class="sd-stage trophyRoomScene" data-sd-enter="scene" data-plate-width="1672" data-plate-height="941"><div class="sd-stage__layer sd-stage__layer--plate"><div class="sd-stage__registered"><div class="sd-stage__plate"></div></div></div><div class="sd-stage__layer sd-stage__layer--atmosphere"></div><div class="sd-stage__layer sd-stage__layer--ui"><div class="trophyPhoneArt" aria-hidden="true"><picture class="trophyPhoneBackdrop"><source media="(max-width: 400px) and (orientation: portrait)" type="image/webp" srcset="${BASE}plates-v3/ENV_TROPHY_ROOM_PHONE_V3.webp"><source type="image/webp" srcset="${tr}assets/ENV_TR_PHONE_V1.webp"><img src="${tr}assets/ENV_TR_PHONE_V1.webp" alt="" width="1179" height="2096" decoding="async"></picture><picture class="trophyPhoneHero trophyPhoneHero--daniel" data-sd-enter="character-left"><source media="(min-width: 401px) and (max-width: 900px) and (orientation: portrait), (max-height: 480px) and (orientation: landscape)" type="image/webp" srcset="${tr}assets/OVL_TR_DANIEL_PHONE_V1.webp"><img alt="" decoding="async"></picture><picture class="trophyPhoneHero trophyPhoneHero--nik" data-sd-enter="character-right"><source media="(min-width: 401px) and (max-width: 900px) and (orientation: portrait), (max-height: 480px) and (orientation: landscape)" type="image/webp" srcset="${tr}assets/OVL_TR_NIK_PHONE_V1.webp"><img alt="" decoding="async"></picture><div class="trophyPhoneArtShade"></div></div><input id="trophyPhoneMoreToggle" class="phoneMoreToggle visually-hidden" type="checkbox" aria-label="Toggle career details" aria-controls="trophyRoomContent"><div id="trophyRoomContent" class="trophyRoomContent sd-stage__ui-content" aria-live="polite"></div><aside id="trophyPhoneSheet" class="sd-sheet trophyPhoneSheet" aria-labelledby="trophyPhoneSheetTitle"><strong id="trophyPhoneSheetTitle" class="trophyPhoneSheetTitle">CAREER DETAILS</strong><span class="trophyPhoneSheetHint">Ranks and career records</span><span class="trophyPhoneSheetClose" aria-hidden="true">CLOSE</span></aside><label class="trophyPhoneMoreButton" for="trophyPhoneMoreToggle" aria-hidden="true"><span class="trophyPhoneMoreOpen">MORE</span><span class="trophyPhoneMoreClose">CLOSE</span></label><div class="nav-reserve trophyPhoneNavReserve" aria-hidden="true"></div></div><div class="sd-stage__layer sd-stage__layer--cutout"><div class="sd-stage__registered"></div></div><div class="sd-stage__layer sd-stage__layer--light"><div class="sd-stage__registered"></div></div></div>`;
  }
  async function v10Platemap(screen){
    if(platemaps[screen])return platemaps[screen];
    const response=await root.fetch(typeof root.optionalAssetUrl==="function"?root.optionalAssetUrl(BASE+FILES[screen].platemap):BASE+FILES[screen].platemap);
    if(!response.ok)throw new Error("CAREER_SCREEN_V10_PLATEMAP");
    platemaps[screen]=await response.json();
    return platemaps[screen];
  }
  function v10Wire(screen,host){
    if(screen==="careerStatistics"){
      const rivalry=host.querySelector("#careerStatisticsRivalryButton");
      if(rivalry){const available=(typeof currentShowdown!=="undefined"&&currentShowdown)||v10Source(screen)?.history?.showdowns?.some(r=>r.status==="completed");rivalry.classList.toggle("hidden",!available);rivalry.addEventListener("click",()=>{if(available&&typeof root.openRivalryStatistics==="function")root.openRivalryStatistics();});}
      const trophy=host.querySelector("#trophyRoomButton");
      if(trophy)trophy.addEventListener("click",()=>{if(typeof root.openOptionalModule==="function")root.openOptionalModule("trophyRoom");});
    }
  }
  function v10Identity(){
    const identity=root.CareerModeOnlinePlayerIdentity;
    return identity&&typeof identity.getState==="function"?identity.getState():null;
  }
  // The frame the loader compares: the model itself, UNAVAILABLE, or null for the local (old) screens.
  function v10Source(screen){
    const getModel=getters[screen];
    if(typeof getModel!=="function")return null;
    const identity=v10Identity();
    let model=getModel();
    // Online with no supplied model: the provider-backed completed-Showdown model (shared with History).
    if(model==null&&v10Seam().isOnlineCareerRoute(identity)){
      model=v10OnlineModel()??(onlineLoading?LOADING:null);
      // r83 (Nik: panels show, vanish, then load again): an "unavailable" career kept from an earlier read is not drawn
      // while a fresh read is running; the screen shows loading once, then the fresh career.
      if(onlineLoading&&model?.status==="unavailable")model=LOADING;
    }
    const source=v10Seam().selectCareerScreenSource({identityState:identity,model});
    if(source==="local")return null;
    return source==="model"?model:UNAVAILABLE;
  }
  function v10Render(screen,model){
    const doc=root.document,host=doc.getElementById(SCREEN_IDS[screen]);
    if(!host)return false;
    const frame=toV10Frame(model,screen);
    // Only one Team V stage exists at a time (both use #stage-root); the other screen is rebuilt on its next open.
    const other=screen==="careerStatistics"?"trophyRoom":"careerStatistics",otherHost=doc.getElementById(SCREEN_IDS[other]);
    if(otherHost&&otherHost.dataset.careerV10==="1"){v10Screens().hide(other);otherHost.remove();}
    host.dataset.careerV10="1";host.classList.add("careerScreenV10");
    host.innerHTML=v10Markup(screen);
    if(screen==="trophyRoom"){
      const smallPhoneStyle=doc.createElement("style");
      smallPhoneStyle.textContent=TROPHY_SMALL_PHONE_CSS+TROPHY_390_PHONE_CSS+TROPHY_430_PHONE_CSS+TROPHY_844_LANDSCAPE_CSS+TROPHY_932_LANDSCAPE_CSS+TROPHY_768_TABLET_CSS+TROPHY_1280_LAPTOP_CSS+TROPHY_1366_CHROMEBOOK_CSS+TROPHY_1920_DESKTOP_CSS+TROPHY_2560_ULTRAWIDE_CSS+TROPHY_SCREEN_1705_CSS+TROPHY_SIDEWAYS_1730_CSS+TROPHY_PLATE_V2_CSS+GOLDEN_SHOWDOWN_CSS;
      host.appendChild(smallPhoneStyle);
    }else{
      const careerStatsStyle=doc.createElement("style");
      careerStatsStyle.textContent=CAREER_STATS_1706_CSS+GOLDEN_SHOWDOWN_CSS;
      host.appendChild(careerStatsStyle);
    }
    v10Wire(screen,host);
    if(screen==="careerStatistics"){
      const cs=BASE+"career-statistics/";
      root.CAREER_STATISTICS_APP=true;root.CAREER_STATISTICS_BASE=cs;root.CAREER_STATISTICS_QS="frame=LIVE";
      root.CAREER_STATISTICS_FIXTURES={strings:STRINGS.careerStatistics,frames:{LIVE:frame}};
      root.CAREER_STATISTICS_PLATEMAP=platemaps.careerStatistics;
      root.CAREER_STATISTICS_ASSETS={plate1x:cs+"assets/ENV_CS_PLATE_V1_1X.webp",plate2x:cs+"assets/ENV_CS_PLATE_V1_2X.webp"};
      root.ShowdownCareerStatisticsBoot();
    }else{
      root.TROPHY_ROOM_APP=true;root.TROPHY_ROOM_BASE=BASE+"trophy-room/";root.TROPHY_ROOM_FRAME="LIVE";
      root.TROPHY_ROOM_FIXTURES={strings:STRINGS.trophyRoom,frames:{LIVE:frame}};
      root.TROPHY_ROOM_PLATEMAP=platemaps.trophyRoom;
      root.ShowdownTrophyRoomBoot();
    }
    return true;
  }
  // The old render paths keep running (they hold the model) and rewrite the host, so a V10 screen is always
  // redrawn after them, as in job 13.
  function v10WrapRender(screen){
    const name=screen==="careerStatistics"?"renderCareerStatistics":"renderTrophyRoom";
    const original=root[name];
    if(typeof original!=="function"||original.careerScreensV10)return;
    const wrapped=function(request=false){
      const result=original(request),host=root.document.getElementById(SCREEN_IDS[screen]);
      if(!host||host.dataset.careerV10!=="1")return result;
      if(v10Source(screen)===null){
        v10Screens().hide(screen);host.remove();
        const open=root[screen==="careerStatistics"?"openCareerStatistics":"openTrophyRoom"];
        if(typeof open==="function")open();
        return result;
      }
      const screens=v10Screens();screens.invalidate(screen);
      screens.show(screen).catch(v10Fail);
      return result;
    };
    wrapped.careerScreensV10=true;root[name]=wrapped;
  }
  function v10Register(){
    if(!registered)registered=root.loadRuntimeScript("v10-screens","js/v10Screens.js",()=>Boolean(root.CareerModeV10Screens)).then(()=>{
      const screens=v10Screens().install();
      // Team V's screen scripts wait for the app's frame when these flags are set before they load.
      root.CAREER_STATISTICS_APP=true;root.TROPHY_ROOM_APP=true;
      for(const screen of Object.keys(SCREEN_IDS)){
        screens.register(screen,{
          css:[FILES[screen].style],
          js:[FILES[screen].script],
          prepare:()=>Promise.all([v10Platemap(screen),v10EnsureChip()]),
          frame:()=>v10Source(screen),
          mount:frame=>{v10Render(screen,frame===UNAVAILABLE?null:frame);},
          // Job 13 leaves its markup in the hidden section; the loader switches its styles off.
          unmount(){onlineLifetimes[screen]++;}
        });
      }
      // Signing in (or out) while a career screen shows reloads its online model: since r61 a signed-out device sees
      // Team V's screen too, so the sign-in chip leads straight to the real career.
      root.addEventListener?.("career-mode-online-identity-change",()=>{
        const live=Object.keys(SCREEN_IDS).filter(screen=>screens.isMounted(screen));
        if(!live.length)return;
        if(live.some(screen=>getters[screen]?.()==null)&&v10Seam().isOnlineCareerRoute(v10Identity())&&v10OnlineModel()==null)v10LoadOnline().catch(v10Fail);
        else v10Redraw();
      });
      // The career start marker changed (switched, or first read after a failed one): reload the online career.
      root.addEventListener?.("career-mode-career-start-change",()=>{
        if(!Object.keys(SCREEN_IDS).some(screen=>screens.isMounted(screen)&&getters[screen]?.()==null))return;
        if(v10Seam().isOnlineCareerRoute(v10Identity()))v10LoadOnline().catch(v10Fail);
      });
      root.addEventListener?.("career-mode-online-career-model-change",()=>{
        // r82 (Nik: panels show, vanish, then load again): this screen's own load redraws once when it ends, so a model
        // published during that load must not draw the same frame a second time.
        if(onlineLoading||!v10Seam().isOnlineCareerRoute(v10Identity())||v10OnlineModel()==null)return;
        for(const screen of Object.keys(SCREEN_IDS))if(screens.isMounted(screen)&&getters[screen]?.()==null){
          screens.invalidate(screen);screens.show(screen).catch(v10Fail);
        }
      });
      return screens;
    }).catch(error=>{registered=null;throw error;});
    return registered;
  }
  function v10ModelText(model){try{return model==null?null:JSON.stringify(model);}catch(_){return null;}}
  function v10OnlineModel(){try{return root.CareerModeRivalryLegacyV10?.cachedCareerModel?.()??null;}catch(_){return null;}}
  function v10Redraw(){
    const screens=v10Screens();
    for(const screen of Object.keys(SCREEN_IDS))if(screens.isMounted(screen)){screens.invalidate(screen);screens.show(screen).catch(v10Fail);}
  }
  // Reads the closed-Showdown career through the same lazy loader History uses (exact gets only, no writes).
  async function v10LoadOnline(screen=Object.keys(SCREEN_IDS).find(id=>v10Screens().isMounted(id))){
    // r82 (Codex JOB-B B3): a warm visit draws its cached career at once; when the fresh read returns the same career, that
    // frame stays (no second boot). Only a changed career is drawn again.
    // An "unavailable" career is drawn as loading while the read runs, so it is always drawn again when the read ends.
    const token=++onlineToken,lifetime=onlineLifetimes[screen],before=v10ModelText(v10OnlineModel());onlineLoading=true;v10Redraw();
    try{
      await root.loadRuntimeScript("rivalry-legacy-v10","js/rivalryLegacyV10.js",()=>Boolean(root.CareerModeRivalryLegacyV10));
      await root.CareerModeRivalryLegacyV10.loadCareerModel(()=>token===onlineToken&&onlineLifetimes[screen]===lifetime&&root.document?.getElementById?.(screen)?.classList?.contains("hidden")!==true);
    }finally{if(token===onlineToken){onlineLoading=false;const after=v10OnlineModel();if(before===null||after?.status==="unavailable"||before!==v10ModelText(after))v10Redraw();}}
  }
  // Called by statistics.js / trophyRoom.js after the old open path; getModel returns the screen's current model.
  async function mount(screen,getModel){
    if(!Object.prototype.hasOwnProperty.call(SCREEN_IDS,screen))throw new TypeError("CAREER_SCREEN_V10_UNKNOWN");
    const screens=await v10Register();
    getters[screen]=getModel;
    v10WrapRender(screen);
    if(getModel()==null&&v10Seam().isOnlineCareerRoute(v10Identity()))v10LoadOnline(screen).catch(v10Fail);
    return screens.show(screen);
  }
  const openCareerStatistics=getModel=>mount("careerStatistics",getModel);
  const openTrophyRoom=getModel=>mount("trophyRoom",getModel);

  return Object.freeze({contractVersion:1,BASE,STRINGS,FILES,toV10Frame,mount,openCareerStatistics,openTrophyRoom});
});
