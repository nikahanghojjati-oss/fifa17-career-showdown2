"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {webcrypto}=require("node:crypto");

let score=3, flushes=0, projections=0, downloads=0, flushSucceeds=true;
const saveId="save_"+"c".repeat(24);
const sandbox={console,Date,JSON,TextEncoder,Uint8Array,structuredClone,
  document:{querySelector:()=>({content:"1.9.1-r1"})},
  window:{crypto:webcrypto,
    flushPendingApplicationWrites:()=>{flushes++;if(!flushSucceeds)return false;score=11;return true;},
    CareerModeSaveLibraryRuntime:{createBackupProjection:()=>{
      projections++;
      const library={activeSaveId:saveId,profiles:[],saves:[{saveId,showdown:{
        identity:{saveId},rounds:[{roundNumber:1,score}]
      }}]};
      const raw=JSON.stringify(library);
      return {ok:true,raw:{saveLibrary:raw,activeShowdown:null,legacyShowdowns:null,preferences:null},
        sourceRaw:{saveLibrary:raw},warnings:[],recovery:null};
    }}
  }
};
sandbox.globalThis=sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname,"../../js/backup.js"),"utf8"),sandbox,{filename:"backup.js"});
vm.runInContext("downloadCareerModeBackupEnvelope = envelope => { globalThis.downloads.push(envelope); return envelope; };",sandbox);
sandbox.downloads=[];

(async()=>{
  const envelope=await sandbox.window.exportCareerModeBackup();
  downloads=sandbox.downloads.length;
  assert.equal(flushes,1,"backup export must flush pending saves first");
  assert.equal(projections,1,"backup must snapshot storage once after the flush");
  assert.equal(downloads,1,"successful export should produce one backup");
  assert.equal(envelope.payload.saveLibrary.saves[0].showdown.rounds[0].score,11,
    "backup must contain the most recent season score instead of the pre-flush score");
  assert.equal(await sandbox.window.verifyCareerModeBackupEnvelopeChecksum(envelope),true);

  flushSucceeds=false;
  await assert.rejects(()=>sandbox.window.exportCareerModeBackup(),
    /Pending application writes could not be flushed safely/,
    "a failed pending save must block download of an incomplete backup");
  assert.equal(projections,1,"failure must occur before reading a new snapshot");
  assert.equal(sandbox.downloads.length,1,"failure must not download a backup");
  console.log("PASS Career backup flushes the latest score and refuses export when a pending save fails.");
})().catch(error=>{console.error(error);process.exitCode=1;});
