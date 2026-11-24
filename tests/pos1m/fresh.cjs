"use strict";
// A fresh copy of a game file per phone tab. Step modules (js/iconGuessStep.js and the other *Step.js files) keep
// module-level memory (won points, presence chains); a real reload starts that memory empty, so each test tab loads its
// own copy instead of sharing one cached module (sharing would be a kinder world than a phone). A planted bug installed
// by tests/pos1m/mutant.cjs is honoured: its changed source is what every fresh copy compiles.
const fs=require("node:fs");
const path=require("node:path");
const Module=require("node:module");
const ROOT=path.resolve(__dirname,"../..");
const sources=new Map();
function sourceOf(absolute){
  const changed=global.__pos1mPlanted&&global.__pos1mPlanted.get(absolute);
  if(changed!==undefined)return changed;
  if(!sources.has(absolute))sources.set(absolute,fs.readFileSync(absolute,"utf8"));
  return sources.get(absolute);
}
function freshModule(relative){
  const absolute=path.join(ROOT,relative);
  const m=new Module(absolute,module);
  m.filename=absolute;m.paths=Module._nodeModulePaths(path.dirname(absolute));
  m._compile(sourceOf(absolute),absolute);
  return m.exports;
}
module.exports={freshModule};
