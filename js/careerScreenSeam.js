(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeCareerScreenSeam=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const SCREENS=["careerStatistics","trophyRoom","legacy","rivalryStatistics"];
  const STATUSES=["loading","empty","unavailable","partial","ready"];
  const TEXT={
    loading:"Loading career history.",
    unavailable:"Career history is unavailable right now. Nothing is lost. Try again when you are reconnected.",
    partial:"Showing {readable} of {indexed} Showdowns. Some Showdowns could not be read, so these are not complete career totals.",
    empty:{
      careerStatistics:"Career Statistics will build automatically after the first completed showdown. Current-showdown statistics remain available from Showdown Home.",
      trophyRoom:"The Trophy Room is empty. Complete a showdown and its managers, trophies, records, and career statistics will appear here automatically.",
      legacy:"No completed showdowns yet. Finish a rivalry and it will be archived here automatically.",
      rivalryStatistics:"No season has been completed yet. Statistics will build automatically as seasons are finished."
    },
    historyStatus:{completed:"Completed","in-progress":"In progress","completion-pending":"Final result, completion pending",abandoned:"Abandoned",unavailable:"Unavailable"},
    winner:{daniel:"Daniel won",nik:"Nik won",draw:"Draw"}
  };
  const csNames={daniel:"Daniel",nik:"Nik",shared:"Shared"};
  const csCareerFields=[["Career points","careerPoints"],["Seasons played","seasons"],["Season wins","seasonWins"],["Season draws","seasonDraws"],["Season losses","seasonLosses"]];
  const csShowdownFields=[["Showdowns completed","completed"],["Showdown wins","wins"],["Showdown draws","draws"],["Showdown losses","losses"]];
  const csRecordFields=[["Best season score","bestSeasonScore"],["Best league points","bestLeaguePoints"],["Best league goals","bestLeagueGoals"],["Best league position","bestLeaguePosition"],["Average season score","averageSeasonScore"],["Average league points","averageLeaguePoints"],["Average league goals","averageLeagueGoals"],["Perfect seasons","perfectSeasons"],["100-point seasons","hundredPointSeasons"],["100-goal seasons","hundredGoalSeasons"],["Top scorer seasons","topScorerSeasons"],["Top assist seasons","topAssistSeasons"],["Performance bonuses","performanceBonuses"],["Awards bonuses","awardsBonuses"]];
  const csCabinetFields=[["Champions Leagues","championsLeagues"],["League titles","leagueTitles"],["Domestic cups","domesticCups"],["Total trophies","totalTrophies"]];
  const csRivalryFields=[["Season wins","seasonWins"],["Season draws","seasonDraws"],["Season losses","seasonLosses"],...csCabinetFields,["Perfect seasons","perfectSeasons"],["Best season score","bestSeasonScore"]];

  function csFreeze(value){
    if(value&&typeof value==="object"&&!Object.isFrozen(value)){
      Object.values(value).forEach(csFreeze);Object.freeze(value);
    }
    return value;
  }
  function normalizeRenderRequest(arg){
    if(arg===undefined||arg===null||arg===false)return Object.freeze({force:false,hasModel:false,model:null});
    if(arg===true)return Object.freeze({force:true,hasModel:false,model:null});
    if(typeof arg!=="object"||Array.isArray(arg))throw new TypeError("CAREER_SCREEN_REQUEST_INVALID");
    const proto=Object.getPrototypeOf(arg);
    if(proto!==null&&Object.getPrototypeOf(proto)!==null)throw new TypeError("CAREER_SCREEN_REQUEST_INVALID");
    return Object.freeze({force:arg.force===true,hasModel:Object.prototype.hasOwnProperty.call(arg,"model"),model:arg.model??null});
  }
  function isOnlineCareerRoute(identityState){
    return Boolean(identityState&&identityState.registered===true&&["daniel","nik"].includes(identityState.managerId));
  }
  // The game is online only, so every career screen is Team V's (r61): with no model it shows the unavailable state,
  // signed in or not. The old local page runs only when Legacy's data tools (backup, restore, reset) are asked for.
  function selectCareerScreenSource({identityState,model,dataTools=false}){
    if(model!==undefined&&model!==null)return model&&STATUSES.includes(model.status)?"model":"unavailable";
    return dataTools===true?"local":"unavailable";
  }
  function csNumber(value){return value===null?"-":Number.isInteger(value)?String(value):value.toFixed(1);}
  function csNumeric(value){return value===null||typeof value==="number"&&Number.isFinite(value);}
  function csFieldsValid(fields,record){return Boolean(record&&fields.every(([,key])=>csNumeric(record[key])));}
  function csModelValid(model){
    if(!model||typeof model!=="object"||!STATUSES.includes(model.status))return false;
    if(model.status!=="ready"&&model.status!=="partial")return true;
    const managers=model.managers,room=model.trophyRoom,history=model.history;
    if(!managers||!room||!history||!Array.isArray(history.showdowns))return false;
    for(const manager of ["daniel","nik"]){
      const record=managers[manager];
      if(!csFieldsValid([...csCareerFields,...csRecordFields,...csCabinetFields],record)||!csFieldsValid(csShowdownFields,record.showdowns)||!csFieldsValid(csCabinetFields,room.cabinet?.[manager]))return false;
    }
    if(!Array.isArray(room.standings)||!Array.isArray(room.records))return false;
    if(!room.standings.every(row=>row&&["daniel","nik"].includes(row.manager)&&csNumeric(row.careerPoints)&&csNumeric(row.seasonWins)))return false;
    if(!room.records.every(row=>row&&typeof row.label==="string"&&["daniel","nik","shared"].includes(row.manager)&&csNumeric(row.value)))return false;
    if(!history.showdowns.every(row=>row&&Number.isInteger(row.number)&&Object.prototype.hasOwnProperty.call(TEXT.historyStatus,row.status)&&Array.isArray(row.seasons)&&(row.status==="abandoned"||row.status==="unavailable"||((!row.totals||csNumeric(row.totals.daniel)&&csNumeric(row.totals.nik))&&row.seasons.every(season=>season&&Number.isInteger(season.season)&&season.score&&csNumeric(season.score.daniel)&&csNumeric(season.score.nik))))))return false;
    return model.status!=="partial"||Boolean(model.coverage&&Number.isInteger(model.coverage.readable)&&Number.isInteger(model.coverage.indexed));
  }
  function csCompare(fields,records){
    return fields.map(([label,key])=>({label,daniel:csNumber(records.daniel[key]),nik:csNumber(records.nik[key])}));
  }
  function csCareerSections(model){
    const win=model.biggestShowdownWin;
    const value=win&&csNames[win.manager]&&csNumeric(win.margin)?csNames[win.manager]+" by "+csNumber(win.margin):"-";
    return [
      {heading:"CAREER TABLE",rows:[...csCompare(csCareerFields,model.managers),...csCompare(csShowdownFields,{daniel:model.managers.daniel.showdowns,nik:model.managers.nik.showdowns}),{label:"Biggest Showdown win",value}]},
      {heading:"SEASON RECORDS",rows:csCompare(csRecordFields,model.managers)}
    ];
  }
  function csTrophySections(model){
    const room=model.trophyRoom;
    return [
      {heading:"MANAGER CABINETS",rows:csCompare(csCabinetFields,room.cabinet)},
      {heading:"CAREER TABLE",rows:room.standings.map((row,index)=>({label:(index+1)+". "+csNames[row.manager]+(row.level?" (level)":""),value:csNumber(row.careerPoints)+" points, "+csNumber(row.seasonWins)+" season wins"}))},
      {heading:"ALL-TIME RECORDS",rows:room.records.map(row=>({label:row.label,value:row.value===null?"-":csNames[row.manager]+" · "+csNumber(row.value)}))}
    ];
  }
  function csLegacySections(model){
    return [{heading:"SHOWDOWNS",rows:model.history.showdowns.map(row=>{
      let value=TEXT.historyStatus[row.status];
      if(row.status!=="abandoned"&&row.status!=="unavailable"){
        if(row.totals)value+=" · Daniel "+csNumber(row.totals.daniel)+" - Nik "+csNumber(row.totals.nik);
        if(Object.prototype.hasOwnProperty.call(TEXT.winner,row.winner))value+=" · "+TEXT.winner[row.winner];
      }
      return {label:"SHOWDOWN "+row.number,value};
    })}];
  }
  function csRivalrySections(model){
    const row=model.history.showdowns[0],totals=row.totals||{daniel:null,nik:null};
    return [
      {heading:"HEAD TO HEAD",rows:[{label:"Showdown points",daniel:csNumber(totals.daniel),nik:csNumber(totals.nik)},...csCompare(csRivalryFields,model.managers)]},
      {heading:"SEASONS",rows:row.seasons.map(season=>({label:"Season "+season.season,daniel:csNumber(season.score.daniel),nik:csNumber(season.score.nik)}))}
    ];
  }
  function careerScreenView(screen,model){
    if(!SCREENS.includes(screen))throw new TypeError("CAREER_SCREEN_UNKNOWN");
    let status=csModelValid(model)?model.status:"unavailable";
    if(screen==="rivalryStatistics"&&["ready","partial"].includes(status)&&model.history.showdowns.length!==1)status="unavailable";
    const interimLabel=status!=="unavailable"&&typeof model.interimLabel==="string"?model.interimLabel:null;
    let message=null,sections=[];
    if(status==="loading")message=TEXT.loading;
    else if(status==="unavailable")message=TEXT.unavailable;
    else if(status==="empty")message=TEXT.empty[screen];
    else{
      if(status==="partial")message=TEXT.partial.replace("{readable}",String(model.coverage.readable)).replace("{indexed}",String(model.coverage.indexed));
      sections=screen==="careerStatistics"?csCareerSections(model):screen==="trophyRoom"?csTrophySections(model):screen==="legacy"?csLegacySections(model):csRivalrySections(model);
    }
    return csFreeze({screen,status,message,interimLabel,sections});
  }
  function csElement(doc,tag,className,text){
    const node=doc.createElement(tag);
    if(className)node.className=className;
    if(text!==undefined)node.textContent=text;
    return node;
  }
  function paintCareerScreenView(doc,view){
    const fragment=doc.createDocumentFragment(),root=csElement(doc,"div","careerScreenView");
    root.setAttribute("data-career-screen",view.screen);root.setAttribute("data-career-status",view.status);
    if(view.interimLabel)root.appendChild(csElement(doc,"p","careerScreenInterim",view.interimLabel));
    if(view.message){
      const message=csElement(doc,"div","analyticsEmpty",view.message);message.setAttribute("role","status");root.appendChild(message);
    }
    for(const section of view.sections){
      root.appendChild(csElement(doc,"h3","analyticsSectionHeading",section.heading));
      const holder=csElement(doc,"div","careerScreenSection");
      if(section.rows.some(row=>Object.prototype.hasOwnProperty.call(row,"daniel"))){
        const names=csElement(doc,"div","comparisonRow careerScreenNames");
        names.append(csElement(doc,"strong","","DANIEL"),csElement(doc,"span","",""),csElement(doc,"strong","","NIK"));holder.appendChild(names);
      }
      for(const row of section.rows){
        if(Object.prototype.hasOwnProperty.call(row,"daniel")){
          const comparison=csElement(doc,"div","comparisonRow");
          comparison.append(csElement(doc,"strong","",row.daniel),csElement(doc,"span","",row.label),csElement(doc,"strong","",row.nik));holder.appendChild(comparison);
        }else{
          const single=csElement(doc,"div","careerScreenRow");
          single.append(csElement(doc,"span","",row.label),csElement(doc,"strong","",row.value));holder.appendChild(single);
        }
      }
      root.appendChild(holder);
    }
    fragment.appendChild(root);return fragment;
  }
  return csFreeze({contractVersion:1,SCREENS,STATUSES,TEXT,normalizeRenderRequest,isOnlineCareerRoute,selectCareerScreenSource,careerScreenView,paintCareerScreenView});
});
