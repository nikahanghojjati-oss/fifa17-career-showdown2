"use strict";
// The Firestore budget layer as a phone runs it (js/sparkPrivatePairing.js, CareerModeFirestoreBudget), one copy per tab.
//
// Production never hands a provider the raw SDK where this matters: js/productionSharedMultiSeasonProgression.js
// (pmspProviderOptions) passes CareerModeFirestoreBudget.services(...).firestoreSdk, so Multi.read and the History,
// Commit, Scoring and Setup reads it makes run through fsbRunTransaction. That layer keeps every document that can never
// change again (an ACKNOWLEDGED commit, published results, a confirmed setup, ...) and reads each other document once.
// Without it the stand-in re-read every accepted season on every attempt (229 legs at season 10), which no phone does:
// H2-2 (2026-11-28, seed 5089592) was that unkind stand-in, not a game stall.
//
// Each tab gets its own copy in its own vm context, so a killed tab or a second tab starts with an empty page memory, as a
// reload does. The copy runs on the tab's own phone clock (skew included) and on the Sim's virtual timers, read at call
// time. A planted bug in js/sparkPrivatePairing.js (tests/pos1m/mutant.cjs) is what every copy compiles.
const vm=require("node:vm");
const path=require("node:path");
const {sourceOf}=require("./fresh.cjs");
const ROOT=path.resolve(__dirname,"../..");
const FILE=path.join(ROOT,"js","sparkPrivatePairing.js");

function budgetFor(tab){
  if(tab.budget)return tab.budget;
  const client=tab.client,RealDate=Date;
  class PhoneDate extends RealDate{constructor(...args){if(args.length)super(...args);else super(client.now());}static now(){return client.now();}}
  const context={
    console,Date:PhoneDate,
    setTimeout:(...args)=>globalThis.setTimeout(...args),clearTimeout:handle=>globalThis.clearTimeout(handle),
    setInterval:(...args)=>globalThis.setInterval(...args),clearInterval:handle=>globalThis.clearInterval(handle)
  };
  vm.createContext(context);
  vm.runInContext(sourceOf(FILE),context,{filename:FILE});
  const api=context.CareerModeFirestoreBudget;
  if(!api||typeof api.services!=="function")throw new Error("POS1M: the Firestore budget layer did not load.");
  tab.budget={api,wrapped:new Map()};
  return tab.budget;
}

// The options a provider gets on this tab, with the SDK the phone's budget layer hands out (same database, same user).
function budgeted(tab,options){
  const budget=budgetFor(tab);
  let services=budget.wrapped.get(options.firestore);
  if(!services){
    services=budget.api.services({ok:true,auth:{currentUser:options.user},firestore:options.firestore,firestoreSdk:options.firebaseSdk});
    if(!services||services.firestoreBudget!==true)throw new Error("POS1M: the budget layer did not wrap the stand-in services.");
    budget.wrapped.set(options.firestore,services);
  }
  return {...options,firebaseSdk:services.firestoreSdk};
}

module.exports={budgetFor,budgeted};
