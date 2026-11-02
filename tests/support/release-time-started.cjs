"use strict";
// 2.0.0: tools/set-release-time.cjs moves Prime Pack, the roulette and the own-club Special Player to the release minute.
// Node tests that play those features with real "now" times (emulator journeys) require this first: every js/ file they
// load then sees the release time as already passed (2026-10-30, the pre-release value), as the CE2PG and L6 journeys are
// served. The files on disk never change. CMS_REAL_RELEASE_TIME=1 keeps the real constants.
const fs=require("node:fs");
const path=require("node:path");
const Module=require("node:module");
const JS=path.resolve(__dirname,"../../js")+path.sep;
const from=`Date.parse("${require("../../tools/set-release-time.cjs").read()[0].value}")`,to='Date.parse("2026-10-30T00:00:00Z")';
if(process.env.CMS_REAL_RELEASE_TIME!=="1"&&!Module.__cmsReleaseTimeStarted){
  Module.__cmsReleaseTimeStarted=true;
  const load=Module._extensions[".js"];
  Module._extensions[".js"]=function(module,filename){
    if(!filename.startsWith(JS))return load(module,filename);
    const source=fs.readFileSync(filename,"utf8");
    if(!source.includes(from))return load(module,filename);
    module._compile(source.split(from).join(to),filename);
  };
}
module.exports={from,to};
