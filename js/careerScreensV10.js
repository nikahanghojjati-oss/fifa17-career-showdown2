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
    careerStatistics:{heading:"CAREER STATISTICS",previewLabel:"",buttons:{rivalry:"CURRENT RIVALRY STATISTICS",trophyRoom:"OPEN TROPHY ROOM",back:"BACK TO MAIN MENU"},sections:{careerTable:"CAREER TABLE",managerComparison:"MANAGER COMPARISON",careerLeaders:"CAREER LEADERS"},headlineLabels:["COMPLETED SHOWDOWNS","SEASONS PLAYED","CAREER POINTS","TROPHIES WON"],comparisonRows:["LEAGUE TITLES","DOMESTIC CUPS","CHAMPIONS LEAGUE WINS","Season Wins","Average League Points","Average League Goals"],leaderLabels:["MOST SEASON WINS","MOST TROPHIES","MOST CAREER POINTS","BEST SEASON SCORE"],careerTableHeaders:["#","Manager","Showdowns","Season W-D-L","Points","Trophies"],noCompletedRecord:"No completed record yet",coverageTemplate:"{READABLE} of {INDEXED} Showdowns readable",stateCopy:{loading:{heading:"LOADING CAREER HISTORY",body:"Loading career history…"},partial:{heading:"PARTIAL CAREER HISTORY",body:"Some Showdowns could not be read. Statistics below use readable Showdowns only."},unavailable:{heading:"CAREER HISTORY UNAVAILABLE",body:"Career history could not be loaded. No statistics are being shown."}}},
    trophyRoom:{heading:"TROPHY ROOM",back:"BACK",previewLabel:"",managerCabinetsHeading:"MANAGER CABINETS",careerTableHeading:"CAREER TABLE",recordsReadyHeading:"ALL-TIME RECORDS",categories:["ALL","SHOWDOWN","LEAGUE TITLES","DOMESTIC CUPS","CHAMPIONS LEAGUE"],trophyTypes:{showdown:"Showdown Champion",leagueTitles:"League Title",domesticCups:"Domestic Cup",championsLeague:"Champions League"},notWonYet:"Not won yet",stateCopy:{loading:{text:"Loading career history…"},partial:{text:"Some Showdowns could not be read. Showing {READABLE} of {INDEXED} Showdowns."},partialRecordsHeading:{text:"AVAILABLE RECORDS"},unavailable:{text:"Career history is unavailable right now."}}}
  });
  const CS_FIELDS=["careerPoints","seasons","seasonWins","seasonDraws","seasonLosses","championsLeagues","leagueTitles","domesticCups","totalTrophies","bestSeasonScore","averageLeaguePoints","averageLeagueGoals"];
  const SHOWDOWN_FIELDS=["completed","wins","draws","losses"];
  const CABINET_FIELDS=["championsLeagues","leagueTitles","domesticCups","totalTrophies"];

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
  const v10Screens=()=>root.CareerModeV10Screens;
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
    display:grid; grid-template-columns:repeat(5,minmax(0,1fr));
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
    grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px;
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
    --tr-hero:clamp(128px,calc(36svh - 60px),224px);
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
  #app #trophyRoom .heroCeremony {position:absolute;inset:68px 33% auto;width:34%;height:calc(var(--tr-hero) - 68px);margin:0;display:block}
  #app #trophyRoom .heroTrophyPicture {left:15%;top:0;width:70%;height:calc(100% - 28px)}
  #app #trophyRoom .heroPlinth {left:0;right:0;bottom:0;height:28px;min-height:28px;clip-path:none;padding:3px 1px}
  #app #trophyRoom .heroPlinth span {font-size:9px;line-height:1.1;white-space:normal;overflow:visible;letter-spacing:.03em}
  #app #trophyRoom .heroPlinth small {font-size:6px;line-height:1.1;letter-spacing:.06em}
  #app #trophyRoom .trophyShelf {position:relative;inset:auto;display:block;width:100%;height:auto;min-height:0;margin:0;padding:4px;border:1px solid #d5ac52;background:#050607d9;border-radius:0}
  #app #trophyRoom .trophyTabs {position:relative;inset:auto;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:2px;width:100%;height:auto;min-height:94px;margin:0 0 5px;padding:2px;border:1px solid #967734;background:#080908;overflow:visible;scroll-snap-type:none}
  #app #trophyRoom .trophyTab {grid-column:span 2;width:auto;min-width:0;min-height:44px;height:auto;padding:3px 2px;border:1px solid #836a36;border-radius:0;font-size:9px;line-height:1.2;letter-spacing:.025em;white-space:normal;overflow-wrap:normal}
  #app #trophyRoom .trophyTab:nth-child(n+4) {grid-column:span 3}
  #app #trophyRoom .shelfGlass {position:relative;inset:auto;display:block;min-height:0;padding:0;border:0;clip-path:none;overflow:visible;background:none}
  #app #trophyRoom .trophyGrid,
  #app #trophyRoom .trophyShelf.is-filtered .trophyGrid {position:relative;inset:auto;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-rows:minmax(var(--tr-row),auto);gap:5px;padding:0;overflow:visible;scroll-snap-type:none}
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
  #app #trophyRoom .trophyBack {position:fixed;left:10px;right:96px;bottom:calc(var(--tr-hub) + 8px);width:auto;height:44px;min-height:44px;margin:0;border:1px solid #d6b054;font-size:14px;background:linear-gradient(#171710,#050607)}
  #app #trophyRoom .trophyPhoneMoreButton {display:flex;position:fixed;right:10px;bottom:calc(var(--tr-hub) + 8px);width:78px;height:44px;align-items:center;justify-content:center;border:1px solid #d6b054;background:linear-gradient(#171710,#050607);color:#f4d485;font:700 11px/1 var(--sd-font-condensed,"Barlow Condensed",Arial,sans-serif);letter-spacing:.12em;text-transform:uppercase;pointer-events:none;z-index:41}
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
  #app #trophyRoom .trophyTabs {grid-template-columns:repeat(5,minmax(0,1fr));min-height:48px;margin-bottom:4px}
  #app #trophyRoom .trophyTab,
  #app #trophyRoom .trophyTab:nth-child(n+4) {grid-column:auto;font-size:9px;padding:2px 3px}
  #app #trophyRoom .trophyGrid {grid-template-columns:repeat(4,minmax(0,1fr))}
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
  #app #trophyRoom .careerRanks {position:absolute;inset:auto 12% auto;top:calc(62svh - 86px);height:66px;display:block}
  #app #trophyRoom .careerRank {top:0;bottom:auto;min-width:0;width:18%;min-height:66px}
  #app #trophyRoom .careerRank small {font-size:clamp(8px,.52vw,11px);line-height:1.25;white-space:normal;overflow-wrap:normal}
  #app #trophyRoom .trophyShelf {position:relative;inset:auto;display:block;width:100%;height:auto;min-height:0;margin:0;padding:0;background:none;border:0;border-radius:0}
  #app #trophyRoom .trophyTabs {position:relative;inset:auto;width:100%;height:auto;min-height:44px;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:1px;overflow:visible}
  #app #trophyRoom .trophyTab {height:auto;min-height:44px;padding:6px 8px;font-size:clamp(10px,.66vw,14px);line-height:1.2;white-space:normal;overflow-wrap:normal}
  #app #trophyRoom .shelfGlass {position:relative;inset:auto;padding:5px;clip-path:none;overflow:visible;border-color:#d5ac52;box-shadow:inset 0 0 0 2px #080909,0 10px 30px #0008}
  #app #trophyRoom .trophyGrid {position:relative;inset:auto;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));grid-auto-rows:minmax(clamp(90px,14svh,160px),auto);gap:8px;overflow:visible}
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
  #app #trophyRoom .trophyShelf.is-filtered .trophyCard h3 {grid-area:name;margin:0;padding:12px 0;border-block:1px solid #a9873b;font-size:clamp(18px,1.5vw,34px);text-align:center}
  #app #trophyRoom .trophyShelf.is-filtered .managerCounts {grid-area:counts;gap:12px;width:100%}
  #app #trophyRoom .trophyShelf.is-filtered .managerCounts > div {text-align:center}
  #app #trophyRoom .trophyShelf.is-filtered .managerCounts > div + div {border-left:1px solid #a9873b}
  #app #trophyRoom .trophyShelf.is-filtered .managerCounts span {font-size:clamp(12px,.9vw,20px);color:#f4dc8b}
  #app #trophyRoom .trophyShelf.is-filtered .managerCounts strong {font-size:clamp(28px,3vw,64px);color:#f4dc8b}
  #app #trophyRoom .trophyShelf.is-filtered .notWonYet {grid-area:empty;margin:0;padding:4px 0;text-align:center}
  #app #trophyRoom .trophyShelf.is-filtered .is-unwon .trophyCardPicture {opacity:.26}
}
`;

  function v10Markup(screen){
    const cs=BASE+"career-statistics/",tr=BASE+"trophy-room/";
    if(screen==="careerStatistics")return `<div id="stage-root" class="careerStage" data-primary="trophyRoomButton"><div class="scene sd-stage" id="careerScene" data-plate-width="1672" data-plate-height="941"><div class="sd-stage__layer sd-stage__layer--plate" aria-hidden="true"><div class="sd-stage__registered"><div class="sd-stage__plate"></div><span class="managerMarker managerDaniel" data-manager="daniel" role="presentation"></span><span class="managerMarker managerNik" data-manager="nik" role="presentation"></span></div></div><div class="sd-stage__layer sd-stage__layer--atmosphere" aria-hidden="true"></div><div class="phoneSceneArt" aria-hidden="true"><picture class="phoneBackground"><source media="(max-width: 760px) and (orientation: portrait)" srcset="${cs}assets/ENV_CS_PHONE_V1.webp"><img alt="" decoding="async"></picture><picture class="phoneHero phoneHeroDaniel"><source media="(max-width: 760px) and (orientation: portrait)" srcset="${cs}assets/OVL_CS_DANIEL_PHONE_V1.webp"><img alt="" decoding="async"></picture><picture class="phoneHero phoneHeroNik"><source media="(max-width: 760px) and (orientation: portrait)" srcset="${cs}assets/OVL_CS_NIK_PHONE_V1.webp"><img alt="" decoding="async"></picture><span class="phoneHeroContact phoneHeroContactDaniel"></span><span class="phoneHeroContact phoneHeroContactNik"></span></div><div class="sd-stage__layer sd-stage__layer--ui"><div class="stateBackdrop" aria-hidden="true"></div><div class="careerScreen" aria-labelledby="careerStatisticsScreenTitle"><section class="phoneFaceBand" aria-label="Career Statistics presentation"><header class="titleBlock"><p class="sd-eyebrow">CAREER MODE SHOWDOWN 17</p><h2 id="careerStatisticsScreenTitle" class="titleWordmark" data-sd-enter="title" tabindex="-1" data-route-focus-target="true"><span class="sd-visually-hidden">CAREER STATISTICS</span><img src="${cs}assets/TITLE_CS_V1.webp" alt="" aria-hidden="true" width="1216" height="126" decoding="async"></h2><p class="sd-tagline">TWO MANAGERS. ONE LEGACY.</p></header></section><div id="previewChip" class="previewChip" hidden></div><section class="phoneHub" aria-label="Career Statistics data"><section id="headlineTiles" class="headlineTiles" aria-label="Career headline totals"></section><input class="phoneTabControl" type="radio" name="careerPhoneTab" id="careerPhoneTable" aria-label="Career Table" aria-controls="careerTablePanel" checked><input class="phoneTabControl" type="radio" name="careerPhoneTab" id="careerPhoneCompare" aria-label="Manager Comparison" aria-controls="comparisonPanel"><input class="phoneTabControl" type="radio" name="careerPhoneTab" id="careerPhoneLeaders" aria-label="Career Leaders" aria-controls="leadersPanel"><div class="phoneTabs" aria-label="Career Statistics sections"><label for="careerPhoneTable">TABLE</label><label for="careerPhoneCompare">COMPARE</label><label for="careerPhoneLeaders">LEADERS</label></div><section id="careerStatisticsContent" class="contentGrid" aria-live="polite"><section id="careerTablePanel" data-sd-enter="panel" class="glassPanel careerTablePanel" aria-labelledby="careerTableHeading"></section><section id="comparisonPanel" data-sd-enter="panel" class="glassPanel comparisonPanel" aria-labelledby="comparisonHeading"></section><section id="leadersPanel" data-sd-enter="panel" class="glassPanel leadersPanel" aria-labelledby="leadersHeading"></section><section id="statePanel" class="glassPanel statePanel" hidden></section></section></section><nav class="actionRow" aria-label="Career Statistics actions" data-phone-primary="trophyRoomButton"><button id="careerStatisticsRivalryButton" class="actionButton secondary" type="button"><span class="buttonIcon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 19h3V9H4v10Zm6 0h3V5h-3v14Zm6 0h3V12h-3v7Z"/></svg></span><span class="actionLabel">CURRENT RIVALRY STATISTICS</span><span aria-hidden="true">›</span></button><button id="trophyRoomButton" data-sd-enter="button" class="actionButton primary" type="button"><img src="${BASE}shared/trophies/TRO_SHOWDOWN_CHAMPION_V1_512.webp" alt="" aria-hidden="true"><span class="actionLabel">OPEN TROPHY ROOM</span><span aria-hidden="true">›</span></button><button class="actionButton secondary backButton" type="button"><span class="buttonIcon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m3 11 9-8 9 8v10h-6v-6H9v6H3V11Z"/></svg></span><span class="actionLabel">BACK TO MAIN MENU</span><span aria-hidden="true">›</span></button></nav></div><div class="gridOverlay" aria-hidden="true"></div></div><div class="sd-stage__layer sd-stage__layer--cutout" aria-hidden="true"><div class="sd-stage__registered"><span class="contactShadow"></span><div class="sd-stage__cutout armCutout" data-src1x="${cs}assets/OVL_CS_DANIEL_CROSSED_ARMS_V1_1X.webp" data-src2x="${cs}assets/OVL_CS_DANIEL_CROSSED_ARMS_V1_2X.webp"></div></div></div><div class="sd-stage__layer sd-stage__layer--light" aria-hidden="true"><div class="sd-stage__registered"><span class="sd-stage__rim armRim" data-src1x="${cs}assets/OVL_CS_DANIEL_CROSSED_ARMS_V1_RIM_1X.webp" data-src2x="${cs}assets/OVL_CS_DANIEL_CROSSED_ARMS_V1_RIM_2X.webp"></span></div></div></div></div>`;
    return `<div class="sd-stage trophyRoomScene" data-sd-enter="scene" data-plate-width="1672" data-plate-height="941"><div class="sd-stage__layer sd-stage__layer--plate"><div class="sd-stage__registered"><div class="sd-stage__plate"></div></div></div><div class="sd-stage__layer sd-stage__layer--atmosphere"></div><div class="sd-stage__layer sd-stage__layer--ui"><div class="trophyPhoneArt" aria-hidden="true"><picture class="trophyPhoneBackdrop"><source type="image/webp" srcset="${tr}assets/ENV_TR_PHONE_V1.webp"><img src="${tr}assets/ENV_TR_PHONE_V1.webp" alt="" width="1179" height="2096" decoding="async"></picture><picture class="trophyPhoneHero trophyPhoneHero--daniel" data-sd-enter="character-left"><source type="image/webp" srcset="${tr}assets/OVL_TR_DANIEL_PHONE_V1.webp"><img src="${tr}assets/OVL_TR_DANIEL_PHONE_V1.webp" alt="" decoding="async"></picture><picture class="trophyPhoneHero trophyPhoneHero--nik" data-sd-enter="character-right"><source type="image/webp" srcset="${tr}assets/OVL_TR_NIK_PHONE_V1.webp"><img src="${tr}assets/OVL_TR_NIK_PHONE_V1.webp" alt="" decoding="async"></picture><div class="trophyPhoneArtShade"></div></div><input id="trophyPhoneMoreToggle" class="phoneMoreToggle visually-hidden" type="checkbox" aria-label="Toggle career details" aria-controls="trophyRoomContent"><div id="trophyRoomContent" class="trophyRoomContent sd-stage__ui-content" aria-live="polite"></div><aside id="trophyPhoneSheet" class="sd-sheet trophyPhoneSheet" aria-labelledby="trophyPhoneSheetTitle"><strong id="trophyPhoneSheetTitle" class="trophyPhoneSheetTitle">CAREER DETAILS</strong><span class="trophyPhoneSheetHint">Ranks and career records</span><span class="trophyPhoneSheetClose" aria-hidden="true">CLOSE</span></aside><label class="trophyPhoneMoreButton" for="trophyPhoneMoreToggle" aria-hidden="true"><span class="trophyPhoneMoreOpen">MORE</span><span class="trophyPhoneMoreClose">CLOSE</span></label><div class="nav-reserve trophyPhoneNavReserve" aria-hidden="true"></div></div><div class="sd-stage__layer sd-stage__layer--cutout"><div class="sd-stage__registered"></div></div><div class="sd-stage__layer sd-stage__layer--light"><div class="sd-stage__registered"></div></div></div>`;
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
      if(rivalry){rivalry.classList.toggle("hidden",!root.currentShowdown);rivalry.addEventListener("click",()=>{if(root.currentShowdown&&typeof root.openRivalryStatistics==="function")root.openRivalryStatistics();});}
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
    if(model==null&&v10Seam().isOnlineCareerRoute(identity))model=v10OnlineModel()??(onlineLoading?LOADING:null);
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
      smallPhoneStyle.textContent=TROPHY_SMALL_PHONE_CSS+TROPHY_390_PHONE_CSS+TROPHY_430_PHONE_CSS+TROPHY_844_LANDSCAPE_CSS+TROPHY_932_LANDSCAPE_CSS+TROPHY_768_TABLET_CSS+TROPHY_1280_LAPTOP_CSS+TROPHY_1366_CHROMEBOOK_CSS+TROPHY_1920_DESKTOP_CSS+TROPHY_2560_ULTRAWIDE_CSS+TROPHY_SCREEN_1705_CSS;
      host.appendChild(smallPhoneStyle);
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
          prepare:()=>v10Platemap(screen),
          frame:()=>v10Source(screen),
          mount:frame=>{v10Render(screen,frame===UNAVAILABLE?null:frame);},
          // Job 13 leaves its markup in the hidden section; the loader switches its styles off.
          unmount(){}
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
      return screens;
    }).catch(error=>{registered=null;throw error;});
    return registered;
  }
  function v10OnlineModel(){try{return root.CareerModeRivalryLegacyV10?.cachedCareerModel?.()??null;}catch(_){return null;}}
  function v10Redraw(){
    const screens=v10Screens();
    for(const screen of Object.keys(SCREEN_IDS))if(screens.isMounted(screen)){screens.invalidate(screen);screens.show(screen).catch(v10Fail);}
  }
  // Reads the closed-Showdown career through the same lazy loader History uses (exact gets only, no writes).
  async function v10LoadOnline(){
    const token=++onlineToken;onlineLoading=true;v10Redraw();
    try{
      await root.loadRuntimeScript("rivalry-legacy-v10","js/rivalryLegacyV10.js",()=>Boolean(root.CareerModeRivalryLegacyV10));
      await root.CareerModeRivalryLegacyV10.loadCareerModel();
    }finally{if(token===onlineToken){onlineLoading=false;v10Redraw();}}
  }
  // Called by statistics.js / trophyRoom.js after the old open path; getModel returns the screen's current model.
  async function mount(screen,getModel){
    if(!Object.prototype.hasOwnProperty.call(SCREEN_IDS,screen))throw new TypeError("CAREER_SCREEN_V10_UNKNOWN");
    const screens=await v10Register();
    getters[screen]=getModel;
    v10WrapRender(screen);
    if(getModel()==null&&v10Seam().isOnlineCareerRoute(v10Identity()))v10LoadOnline().catch(v10Fail);
    return screens.show(screen);
  }
  const openCareerStatistics=getModel=>mount("careerStatistics",getModel);
  const openTrophyRoom=getModel=>mount("trophyRoom",getModel);

  return Object.freeze({contractVersion:1,BASE,STRINGS,FILES,toV10Frame,mount,openCareerStatistics,openTrophyRoom});
});
