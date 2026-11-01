(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeDeadlineDayLines=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  // r87 Deadline Day (Nik's ask): the last 60 seconds of the Transfer Challenge window. The r86 commentary engine
  // (js/commentaryEngine.js, data/commentarySituations.json) has no transfer-window situation, so these are a small fixed set
  // in the same row style. ticker: the DEADLINE DAY strip's rolling headlines (shown from 60 seconds left). countdown: the one
  // commentator line shown from 10 seconds left. Slots: {season} only (the Transfer Challenge's season number). js/deadlineDay.js
  // picks by season, so both phones show the same line. Words only: nothing here decides, scores or reads anything.
  const freeze=list=>Object.freeze(list.map(row=>Object.freeze(row)));
  const TICKER=freeze([
    {"id":"dd-t-01","situation":"deadline-ticker","text":"Fax machines warming up across Europe"},
    {"id":"dd-t-02","situation":"deadline-ticker","text":"Agents spotted pacing the training ground car park"},
    {"id":"dd-t-03","situation":"deadline-ticker","text":"Late bids flying in from every direction"},
    {"id":"dd-t-04","situation":"deadline-ticker","text":"Medicals booked, shirts printed, pens at the ready"},
    {"id":"dd-t-05","situation":"deadline-ticker","text":"Every signing must be in before the window slams shut"},
    {"id":"dd-t-06","situation":"deadline-ticker","text":"Chairmen glued to their phones in season {season}"},
    {"id":"dd-t-07","situation":"deadline-ticker","text":"Paperwork racing the clock down the corridor"},
    {"id":"dd-t-08","situation":"deadline-ticker","text":"Reporters camped outside the gates as the window closes"}
  ]);
  const COUNTDOWN=freeze([
    {"id":"dd-c-01","situation":"deadline-ten-seconds","text":"Ten seconds left in the window. If it is not signed now, it is not happening!"},
    {"id":"dd-c-02","situation":"deadline-ten-seconds","text":"The fax machine is smoking! Ten seconds to go on deadline day!"},
    {"id":"dd-c-03","situation":"deadline-ten-seconds","text":"Here comes the final countdown of season {season}. Get those deals over the line!"},
    {"id":"dd-c-04","situation":"deadline-ten-seconds","text":"Ten seconds! Somebody sprint that paperwork down the corridor!"},
    {"id":"dd-c-05","situation":"deadline-ten-seconds","text":"It is going right to the wire. Ten seconds before the window slams shut!"},
    {"id":"dd-c-06","situation":"deadline-ten-seconds","text":"Ten, nine, eight... this is what deadline day is all about!"}
  ]);
  return Object.freeze({contentVersion:1,slots:Object.freeze(["season"]),ticker:TICKER,countdown:COUNTDOWN});
});
