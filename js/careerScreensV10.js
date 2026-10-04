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
      managers[manager]=v10Pick(model.managers[manager],CS_FIELDS);
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
  let registered=null;
  const v10Screens=()=>root.CareerModeV10Screens;
  function v10Fail(error){if(typeof root.reportApplicationError==="function")root.reportApplicationError("Career screens could not load",error);}

  function v10Markup(screen){
    const cs=BASE+"career-statistics/",tr=BASE+"trophy-room/";
    if(screen==="careerStatistics")return `<div id="stage-root" class="careerStage" data-primary="trophyRoomButton"><div class="scene sd-stage" id="careerScene" data-plate-width="1672" data-plate-height="941"><div class="sd-stage__layer sd-stage__layer--plate" aria-hidden="true"><div class="sd-stage__registered"><div class="sd-stage__plate"></div><span class="managerMarker managerDaniel" data-manager="daniel" role="presentation"></span><span class="managerMarker managerNik" data-manager="nik" role="presentation"></span></div></div><div class="sd-stage__layer sd-stage__layer--atmosphere" aria-hidden="true"></div><div class="phoneSceneArt" aria-hidden="true"><picture class="phoneBackground"><source media="(max-width: 760px) and (orientation: portrait)" srcset="${cs}assets/ENV_CS_PHONE_V1.webp"><img alt="" decoding="async"></picture><picture class="phoneHero phoneHeroDaniel"><source media="(max-width: 760px) and (orientation: portrait)" srcset="${cs}assets/OVL_CS_DANIEL_PHONE_V1.webp"><img alt="" decoding="async"></picture><picture class="phoneHero phoneHeroNik"><source media="(max-width: 760px) and (orientation: portrait)" srcset="${cs}assets/OVL_CS_NIK_PHONE_V1.webp"><img alt="" decoding="async"></picture><span class="phoneHeroContact phoneHeroContactDaniel"></span><span class="phoneHeroContact phoneHeroContactNik"></span></div><div class="sd-stage__layer sd-stage__layer--ui"><div class="stateBackdrop" aria-hidden="true"></div><div class="careerScreen" aria-labelledby="careerStatisticsScreenTitle"><section class="phoneFaceBand" aria-label="Career Statistics presentation"><header class="titleBlock"><p class="sd-eyebrow">CAREER MODE SHOWDOWN 17</p><h2 id="careerStatisticsScreenTitle" class="titleWordmark" data-sd-enter="title" tabindex="-1" data-route-focus-target="true"><span class="sd-visually-hidden">CAREER STATISTICS</span><img src="${cs}assets/TITLE_CS_V1.webp" alt="" aria-hidden="true" width="1216" height="126" decoding="async"></h2><p class="sd-tagline">TWO MANAGERS. ONE LEGACY.</p></header></section><div id="previewChip" class="previewChip" hidden></div><section class="phoneHub" aria-label="Career Statistics data"><section id="headlineTiles" class="headlineTiles" aria-label="Career headline totals"></section><input class="phoneTabControl" type="radio" name="careerPhoneTab" id="careerPhoneTable" aria-label="Career Table" aria-controls="careerTablePanel" checked><input class="phoneTabControl" type="radio" name="careerPhoneTab" id="careerPhoneCompare" aria-label="Manager Comparison" aria-controls="comparisonPanel"><input class="phoneTabControl" type="radio" name="careerPhoneTab" id="careerPhoneLeaders" aria-label="Career Leaders" aria-controls="leadersPanel"><div class="phoneTabs" aria-label="Career Statistics sections"><label for="careerPhoneTable">TABLE</label><label for="careerPhoneCompare">COMPARE</label><label for="careerPhoneLeaders">LEADERS</label></div><section id="careerStatisticsContent" class="contentGrid" aria-live="polite"><section id="careerTablePanel" data-sd-enter="panel" class="glassPanel careerTablePanel" aria-labelledby="careerTableHeading"></section><section id="comparisonPanel" data-sd-enter="panel" class="glassPanel comparisonPanel" aria-labelledby="comparisonHeading"></section><section id="leadersPanel" data-sd-enter="panel" class="glassPanel leadersPanel" aria-labelledby="leadersHeading"></section><section id="statePanel" class="glassPanel statePanel" hidden></section></section></section><nav class="actionRow" aria-label="Career Statistics actions" data-phone-primary="trophyRoomButton"><button id="careerStatisticsRivalryButton" class="actionButton secondary" type="button"><span class="buttonIcon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 19h3V9H4v10Zm6 0h3V5h-3v14Zm6 0h3V12h-3v7Z"/></svg></span><span class="actionLabel">CURRENT RIVALRY STATISTICS</span><span aria-hidden="true">›</span></button><button id="trophyRoomButton" data-sd-enter="button" class="actionButton primary" type="button"><img src="${BASE}shared/trophies/TRO_SHOWDOWN_CHAMPION_V1_512.webp" alt="" aria-hidden="true"><span class="actionLabel">OPEN TROPHY ROOM</span><span aria-hidden="true">›</span></button><button class="actionButton secondary backButton" type="button"><span class="buttonIcon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m3 11 9-8 9 8v10h-6v-6H9v6H3V11Z"/></svg></span><span class="actionLabel">BACK TO MAIN MENU</span><span aria-hidden="true">›</span></button></nav></div><div class="gridOverlay" aria-hidden="true"></div></div><div class="sd-stage__layer sd-stage__layer--cutout" aria-hidden="true"><div class="sd-stage__registered"><span class="contactShadow"></span><div class="sd-stage__cutout armCutout" data-src1x="${cs}assets/OVL_CS_DANIEL_CROSSED_ARMS_V1_1X.webp" data-src2x="${cs}assets/OVL_CS_DANIEL_CROSSED_ARMS_V1_2X.webp"></div></div></div><div class="sd-stage__layer sd-stage__layer--light" aria-hidden="true"><div class="sd-stage__registered"><span class="sd-stage__rim armRim" data-src1x="${cs}assets/OVL_CS_DANIEL_CROSSED_ARMS_V1_RIM_1X.webp" data-src2x="${cs}assets/OVL_CS_DANIEL_CROSSED_ARMS_V1_RIM_2X.webp"></span></div></div></div></div>`;
    return `<div class="sd-stage trophyRoomScene" data-sd-enter="scene" data-plate-width="1672" data-plate-height="941"><div class="sd-stage__layer sd-stage__layer--plate"><div class="sd-stage__registered"><div class="sd-stage__plate"></div></div></div><div class="sd-stage__layer sd-stage__layer--atmosphere"></div><div class="sd-stage__layer sd-stage__layer--ui"><div class="trophyPhoneArt" aria-hidden="true"><picture class="trophyPhoneBackdrop"><source type="image/webp" srcset="${tr}assets/ENV_TR_PHONE_V1.webp"><img src="${tr}assets/ENV_TR_PHONE_V1.webp" alt="" width="1179" height="2096" decoding="async"></picture><picture class="trophyPhoneHero trophyPhoneHero--daniel" data-sd-enter="character-left"><source type="image/webp" srcset="${tr}assets/OVL_TR_DANIEL_PHONE_V1.webp"><img src="${tr}assets/OVL_TR_DANIEL_PHONE_V1.webp" alt="" decoding="async"></picture><picture class="trophyPhoneHero trophyPhoneHero--nik" data-sd-enter="character-right"><source type="image/webp" srcset="${tr}assets/OVL_TR_NIK_PHONE_V1.webp"><img src="${tr}assets/OVL_TR_NIK_PHONE_V1.webp" alt="" decoding="async"></picture><div class="trophyPhoneArtShade"></div></div><input id="trophyPhoneMoreToggle" class="phoneMoreToggle visually-hidden" type="checkbox" aria-label="Toggle career details" aria-controls="trophyRoomContent"><div id="trophyRoomContent" class="trophyRoomContent sd-stage__ui-content" aria-live="polite"></div><aside id="trophyPhoneSheet" class="sd-sheet trophyPhoneSheet" aria-labelledby="trophyPhoneSheetTitle"><strong id="trophyPhoneSheetTitle" class="trophyPhoneSheetTitle">CAREER DETAILS</strong><span class="trophyPhoneSheetHint">Ranks and career records</span><span class="trophyPhoneSheetClose" aria-hidden="true">CLOSE</span></aside><label class="trophyPhoneMoreButton" for="trophyPhoneMoreToggle" aria-hidden="true"><span class="trophyPhoneMoreOpen">MORE</span><span class="trophyPhoneMoreClose">CLOSE</span></label><div class="nav-reserve trophyPhoneNavReserve" aria-hidden="true"></div></div><div class="sd-stage__layer sd-stage__layer--cutout"><div class="sd-stage__registered"></div></div><div class="sd-stage__layer sd-stage__layer--light"><div class="sd-stage__registered"></div></div></div>`;
  }
  async function v10Platemap(screen){
    if(platemaps[screen])return platemaps[screen];
    const response=await root.fetch(BASE+FILES[screen].platemap);
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
    const model=getModel(),source=v10Seam().selectCareerScreenSource({identityState:v10Identity(),model});
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
      return screens;
    }).catch(error=>{registered=null;throw error;});
    return registered;
  }
  // Called by statistics.js / trophyRoom.js after the old open path; getModel returns the screen's current model.
  async function mount(screen,getModel){
    if(!Object.prototype.hasOwnProperty.call(SCREEN_IDS,screen))throw new TypeError("CAREER_SCREEN_V10_UNKNOWN");
    const screens=await v10Register();
    getters[screen]=getModel;
    v10WrapRender(screen);
    return screens.show(screen);
  }
  const openCareerStatistics=getModel=>mount("careerStatistics",getModel);
  const openTrophyRoom=getModel=>mount("trophyRoom",getModel);

  return Object.freeze({contractVersion:1,BASE,STRINGS,FILES,toV10Frame,mount,openCareerStatistics,openTrophyRoom});
});
