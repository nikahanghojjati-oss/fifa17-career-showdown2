(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeStartJoinViewModel=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  const CONFIRM=Object.freeze({});
  const NAV_LOCK_TEXT="Finish this step first";
  const LOCKED_SCREENS=Object.freeze({});

  function sjFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(sjFreeze);Object.freeze(value);}return value;}
  function buildStartJoinViewModel(){throw new Error("not implemented");}
  function navLockState(){throw new Error("not implemented");}

  return sjFreeze({buildStartJoinViewModel,navLockState,CONFIRM,NAV_LOCK_TEXT,LOCKED_SCREENS,contractVersion:1});
});
