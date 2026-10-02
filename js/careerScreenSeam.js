(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeCareerScreenSeam=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  function normalizeRenderRequest(){throw new Error("not implemented");}
  function isOnlineCareerRoute(){throw new Error("not implemented");}
  function selectCareerScreenSource(){throw new Error("not implemented");}
  function careerScreenView(){throw new Error("not implemented");}
  function paintCareerScreenView(){throw new Error("not implemented");}
  return Object.freeze({normalizeRenderRequest,isOnlineCareerRoute,selectCareerScreenSource,careerScreenView,paintCareerScreenView});
});
