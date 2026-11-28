"use strict";
// The Firestore budget layer as a phone runs it (js/sparkPrivatePairing.js, CareerModeFirestoreBudget), one copy per tab.
//
// Production never hands a shared provider the raw SDK: each production module passes
// CareerModeFirestoreBudget.services(...).firestoreSdk (js/productionSharedMultiSeasonProgression.js pmspProviderOptions,
// js/productionSharedHistoryConvergence.js phcProviderOptions, and the other production*.js callers), so every read and
// write runs through fsbRunTransaction on one page-wide copy. That layer keeps every document that can never change again
// (an ACKNOWLEDGED commit, published results, a confirmed setup, ...), reads each other document once, marks what a write
// touched stale, and forgets everything it kept after a denied write.
// Without it the stand-in re-read every accepted season on every attempt (229 legs at season 10), which no phone does:
// H2-2 (2026-11-28, seed 5089592) was that unkind stand-in, not a game stall.
//
// Each tab gets its own copy, so a killed tab or a second tab starts with an empty page memory, as a reload does. The
// copy runs on the tab's own phone clock (skew included) for calendar time, on unskewed Sim time for performance.now(),
// and on the Sim's virtual timers, read at call time. A planted bug in js/sparkPrivatePairing.js
// (tests/pos1m/mutant.cjs) is what every copy compiles.
const vm=require("node:vm");
const path=require("node:path");
const {sourceOf}=require("./fresh.cjs");
const ROOT=path.resolve(__dirname,"../..");
const FILE=path.join(ROOT,"js","sparkPrivatePairing.js");

// The file is compiled ONCE (per source text: a planted bug changes it) as a function of its page object and its Date, and
// each tab calls it with its own: the file only ever reaches its page through that object (root.setTimeout,
// root.performance, root.document, ...) and the clock through Date, so every tab gets a separate, empty layer. A vm
// context per tab did the same but V8 never gave the compiled code of ~100,000 contexts back (a 20,000-story run reached
// 14 GB and was killed).
let compiled=null;
function pageFactory(source){
  if(!compiled||compiled.source!==source)compiled={source,fn:vm.compileFunction(source,["globalThis","Date","Intl"],{filename:FILE})};
  return compiled.fn;
}
// The layer builds a new Intl.DateTimeFormat for the Pacific day on every counted read. A formatter is a large ICU object
// behind a tiny JS one, so V8 collects them late; at Ring 1's pace (millions of reads per run) that alone grew a worker by
// ~0.8 MB a story. Same answers from one formatter per (locale, options).
const formatters=new Map();
const PageIntl=Object.create(Intl,{DateTimeFormat:{value:function DateTimeFormat(locale,options){
  const key=JSON.stringify([locale,options]);let formatter=formatters.get(key);
  if(!formatter){formatter=new Intl.DateTimeFormat(locale,options);formatters.set(key,formatter);}
  return formatter;
}}});

function budgetFor(tab){
  if(tab.budget)return tab.budget;
  const client=tab.client,RealDate=Date;
  class PhoneDate extends RealDate{constructor(...args){if(args.length)super(...args);else super(client.now());}static now(){return client.now();}}
  // performance.now() is the phone's monotonic clock: unskewed Sim time. A real browser has it, so fsbNow() takes its
  // monotonic branch and a phone clock moved backward (Manager.maybeChaos skew) never freezes or stretches a window
  // (Codex #1653: without it fsbNow fell back to the skewed wall clock).
  const origin=client.sim.now;
  const page={
    console,Date:PhoneDate,performance:{now:()=>client.sim.now-origin},
    setTimeout:(...args)=>globalThis.setTimeout(...args),clearTimeout:handle=>globalThis.clearTimeout(handle),
    setInterval:(...args)=>globalThis.setInterval(...args),clearInterval:handle=>globalThis.clearInterval(handle)
  };
  pageFactory(sourceOf(FILE))(page,PhoneDate,PageIntl);
  const api=page.CareerModeFirestoreBudget;
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
