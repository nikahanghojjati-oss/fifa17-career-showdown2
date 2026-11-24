"use strict";
// POS1M planted bugs. Each planted bug is one exact text change to one game file (tests/pos1m/planted/<id>.json):
//   {"id","law","title","file","find","replace","why"} plus optional "also":[{"file"?,"find","replace"}] for more
//   spots (one bug that needs several edits, such as a read and the projection that shows it, or a rule in two copies).
// `find` must occur exactly once in the file at the head being tested, so a planted bug can never silently stop
// applying. install() loads the changed file into the module cache under its real path before anything requires it
// (call it first, in a fresh worker or process). toPatch() renders the same change as a unified diff for `git apply`,
// so today's Gate can be run on the identical mutant.
const fs=require("node:fs");
const path=require("node:path");
const Module=require("node:module");
const ROOT=path.resolve(__dirname,"../..");
const DIR=path.join(__dirname,"planted");

function list(){return fs.readdirSync(DIR).filter(name=>name.endsWith(".json")).sort().map(name=>load(path.join(DIR,name)));}
function load(file){
  const bug=JSON.parse(fs.readFileSync(file,"utf8"));
  for(const key of ["id","law","title","file","find","replace","why"])if(typeof bug[key]!=="string"||(!bug[key]&&key!=="replace"))throw new Error(`${file}: ${key} missing`);// an empty replace deletes (a guard removed)
  if(bug.find===bug.replace)throw new Error(`${bug.id}: find and replace are the same`);
  for(const edit of bug.also||[])if((edit.file!==undefined&&typeof edit.file!=="string")||typeof edit.find!=="string"||typeof edit.replace!=="string"||!edit.find||edit.find===edit.replace)throw new Error(`${file}: bad also edit`);
  return bug;
}
// Every file a bug changes: {file -> {absolute,source,mutated}}. An "also" edit may name its own "file" (a rule
// changed in both copies the game keeps, so the game's own cross-check cannot see it and only a law can).
function mutatedFiles(bug){
  const out=new Map();
  for(const edit of [{file:bug.file,find:bug.find,replace:bug.replace},...(bug.also||[]).map(e=>({file:e.file||bug.file,...e}))]){
    if(!out.has(edit.file)){const absolute=path.join(ROOT,edit.file);const source=fs.readFileSync(absolute,"utf8");out.set(edit.file,{absolute,source,mutated:source});}
    const entry=out.get(edit.file);
    const first=entry.mutated.indexOf(edit.find);
    if(first<0)throw new Error(`${bug.id}: find text is not in ${edit.file} (the game changed: update the planted bug)`);
    if(entry.mutated.indexOf(edit.find,first+1)>=0)throw new Error(`${bug.id}: find text occurs more than once in ${edit.file}`);
    entry.mutated=entry.mutated.slice(0,first)+edit.replace+entry.mutated.slice(first+edit.find.length);
  }
  return out;
}
function install(bug){
  require("./world.cjs");// the browser globals the game files read when they load (window, transfer options)
  const files=mutatedFiles(bug),installed=[];
  for(const [file,{absolute}] of files)if(require.cache[absolute])throw new Error(`${bug.id}: ${file} was loaded before the planted bug`);
  for(const {absolute,mutated} of files.values()){
    const m=new Module(absolute,module);
    m.filename=absolute;m.paths=Module._nodeModulePaths(path.dirname(absolute));
    m._compile(mutated,absolute);
    m.loaded=true;
    require.cache[absolute]=m;installed.push(absolute);
    (global.__pos1mPlanted||(global.__pos1mPlanted=new Map())).set(absolute,mutated);// fresh per-tab copies (fresh.cjs) too
  }
  return installed;
}
function filePatch(file,source,mutated){
  const a=source.split("\n"),b=mutated.split("\n");
  let start=0;while(start<a.length&&a[start]===b[start])start+=1;
  let endA=a.length-1,endB=b.length-1;while(endA>=start&&endB>=start&&a[endA]===b[endB]){endA-=1;endB-=1;}
  const ctxStart=Math.max(0,start-3),ctxEndA=Math.min(a.length-1,endA+3),ctxEndB=Math.min(b.length-1,endB+3);
  const lines=[`--- a/${file}`,`+++ b/${file}`,`@@ -${ctxStart+1},${ctxEndA-ctxStart+1} +${ctxStart+1},${ctxEndB-ctxStart+1} @@`];
  for(let i=ctxStart;i<start;i+=1)lines.push(` ${a[i]}`);
  for(let i=start;i<=endA;i+=1)lines.push(`-${a[i]}`);
  for(let i=start;i<=endB;i+=1)lines.push(`+${b[i]}`);
  for(let i=endA+1;i<=ctxEndA;i+=1)lines.push(` ${a[i]}`);
  return `${lines.join("\n")}\n`;
}
// The same change as a unified diff (one hunk per file: the game files are minified, so edits sit on few lines).
function toPatch(bug){return [...mutatedFiles(bug)].map(([file,{source,mutated}])=>filePatch(file,source,mutated)).join("");}
module.exports={list,load,install,toPatch,mutatedFiles,DIR};
