(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSharedCareerAnalytics=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  function buildCareerModel(){throw new Error("not implemented");}
  function seasonTiebreak(){throw new Error("not implemented");}
  return Object.freeze({buildCareerModel,seasonTiebreak});
});
