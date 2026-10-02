(function(root,factory){
  const node=typeof module!=="undefined"&&module.exports;
  const api=factory(node?require("./sharedHistoryConvergence.js"):root.CareerModeSharedHistoryConvergence,node?require("./sharedCareerAnalytics.js"):root.CareerModeSharedCareerAnalytics,node?require("./sharedTerminalClose.js"):root.CareerModeSharedTerminalClose,node?require("./sharedFinalReconciliation.js"):root.CareerModeSharedFinalReconciliation);
  if(node)module.exports=api;else root.CareerModeSharedActiveShowdownAdapter=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(History,Career,Terminal,Final){
 "use strict";
 function pending(){throw new Error("not implemented");}
 return Object.freeze({buildActiveShowdownViews:pending,classifyCurrentShowdown:pending,homeView:pending,rivalryView:pending,seasonResultsView:pending,finalWinnerView:pending,careerInput:pending});
});
