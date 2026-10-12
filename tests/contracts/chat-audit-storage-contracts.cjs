"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const source=fs.readFileSync(path.join(__dirname,"../../js/storage.js"),"utf8");
let saves=0,cleared=0,nextTimer=0;
const page={
  console,
  setTimeout:()=>++nextTimer,
  clearTimeout:()=>{cleared+=1;},
  CareerModeSaveLibraryRuntime:{
    isReady:()=>true,
    saveCurrentShowdown:()=>{saves+=1;return true;}
  },
  flushTransferDraftSave:()=>false
};
page.window=page;
vm.createContext(page);
vm.runInContext("var currentShowdown={status:'In Progress'};",page);
vm.runInContext(source,page,{filename:"js/storage.js"});

assert.equal(page.scheduleCurrentShowdownSave(),true);
assert.equal(page.flushPendingApplicationWrites(),false,"failed transfer flush must still be reported");
assert.equal(saves,1,"a failed transfer flush must not skip the independently pending career save");
assert.equal(cleared,1,"the current career timer must be cleared after the successful flush");

page.flushTransferDraftSave=()=>true;
assert.equal(page.scheduleCurrentShowdownSave(),true);
assert.equal(page.flushPendingApplicationWrites(),true);
assert.equal(saves,2,"a successful transfer flush must also flush the current career save");
console.log("PASS storage: pending career save is flushed even when transfer save fails.");
