(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeStartJoinViewModel=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  const CONFIRM=Object.freeze({});
  const NAV_LOCK_TEXT="Finish this step first";
  const LOCKED_SCREENS=Object.freeze({transferChallenge:"transfer-window",seasonEntry:"season-entry",leagueWheelScreen:"setup",clubWheelScreen:"setup"});
  const sjScreenIds=Object.freeze(["mainMenu","createShowdown","leagueWheelScreen","clubWheelScreen","dashboard","transferChallenge","seasonEntry","seasonSummary","statistics","careerStatistics","trophyRoom","legacy","ruleBook"]);

  function sjFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(sjFreeze);Object.freeze(value);}return value;}
  function buildStartJoinViewModel(){throw new Error("not implemented");}
  function navLockState(activeScreen){
    if(activeScreen===null||sjScreenIds.includes(activeScreen)){
      const reason=activeScreen===null?null:LOCKED_SCREENS[activeScreen]||null;
      return sjFreeze({locked:reason!==null,reason});
    }
    throw new TypeError("NAV_SCREEN_UNKNOWN");
  }

  return sjFreeze({buildStartJoinViewModel,navLockState,CONFIRM,NAV_LOCK_TEXT,LOCKED_SCREENS,contractVersion:1});
});
