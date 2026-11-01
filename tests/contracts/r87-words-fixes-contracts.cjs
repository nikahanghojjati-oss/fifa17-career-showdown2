"use strict";
// Run explicitly: node tests/contracts/r87-words-fixes-contracts.cjs.
// The supplemental registry belongs to the excluded PRs, so it stays untouched.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
const read = f => fs.readFileSync(path.join(ROOT, f), "utf8");
let checks = 0;
function check(name, work) { work(); checks++; console.log(`PASS ${name}`); }
function jsStrings(src){
  const out=[];let i=0;const n=src.length;let prev="";const stack=[];
  const ident=c=>/[A-Za-z0-9_$]/.test(c);
  const regexMayStart=p=>p===""||/[(,=:[!&|?{};+\-*%<>~^]$/.test(p)||/^(return|typeof|case|in|of|delete|void|throw|new|else|do)$/.test(p);
  function quoted(q){let s="";i+=1;while(i<n&&src[i]!==q){if(src[i]==="\\"){s+=src[i+1]==="n"?"\n":src[i+1];i+=2;continue;}s+=src[i++];}i+=1;out.push(s);prev="x";}
  function template(){let s="";while(i<n){const c=src[i];if(c==="\\"){s+=src[i+1];i+=2;continue;}if(c==="`"){i+=1;out.push(s);prev="x";return;}if(c==="$"&&src[i+1]==="{"){out.push(s);i+=2;stack.push(0);prev="{";return;}s+=c;i+=1;}}
  while(i<n){const c=src[i];
    if(/\s/.test(c)){i+=1;continue;}
    if(c==="/"&&src[i+1]==="/"){while(i<n&&src[i]!=="\n")i+=1;continue;}
    if(c==="/"&&src[i+1]==="*"){const end=src.indexOf("*/",i+2);i=end<0?n:end+2;continue;}
    if(c==="'"||c==='"'){quoted(c);continue;}
    if(c==="`"){i+=1;template();continue;}
    if(c==="/"&&regexMayStart(prev)){i+=1;let cls=false;while(i<n&&src[i]!=="\n"){const d=src[i];if(d==="\\"){i+=2;continue;}if(d==="[")cls=true;else if(d==="]")cls=false;else if(d==="/"&&!cls)break;i+=1;}i+=1;while(i<n&&/[a-z]/i.test(src[i]))i+=1;prev="x";continue;}
    if(stack.length){if(c==="{")stack[stack.length-1]+=1;else if(c==="}"){if(stack[stack.length-1]===0){stack.pop();i+=1;template();continue;}stack[stack.length-1]-=1;}}
    if(ident(c)){let w="";while(i<n&&ident(src[i]))w+=src[i++];prev=w;continue;}
    prev=c;i+=1;}
  return out;
}
check("W1 backup Trophy Room: record and margin units are singular at one", () => {
  // This older function is at file scope; use its next closing brace.
  const source = read("js/trophyRoom.js"), start = source.indexOf("function seasonRecordText("), end = source.indexOf("\n}", start);
  const recordText = vm.runInNewContext(`(${source.slice(start, end + 2)})`);
  for (const n of [0, 1, 2, 11]) for (const [suffix, singular] of [[" pts", " pt"], [" goals", " goal"]])
    assert.equal(recordText({value: n, holders: [{manager: "Nik", club: "Arsenal", season: 1, showdown: "Test"}]}, suffix).value, `${n}${n === 1 ? singular : suffix}`);
  const margin = source.match(/value: (`\$\{records.biggestShowdownMargin.value\}[^`]+`)/)[1];
  for (const n of [1, 2, 11]) assert.equal(vm.runInNewContext(margin, {records: {biggestShowdownMargin: {value: n}}}), `${n} pt${n === 1 ? "" : "s"}`);
});
check("W2 player-facing names remain Special Player / SP, including generated copy", () => {
  const files = require("node:child_process").execFileSync("git", ["ls-files", "js/*.js", "data/*.js", "visual-assets/**/*.js", "visual-assets/**/*.json", "visual-assets/**/*.html"], {cwd: ROOT, encoding: "utf8"}).trim().split("\n");
  const hits = [];
  const protectedFiles = new Set(Object.values(JSON.parse(read("audit/r87-words/excluded-pr-files.json"))).flat());
  for (const file of files) {
    if (file.endsWith(".min.js")) continue;
    const source = read(file);
    // Internal identifiers / module paths are API names, never player-facing terms.
    const text = file.endsWith(".js") ? jsStrings(source).join("\n") : source.replace(/<!--[\s\S]*?-->/g, "").replace(/<script[\s\S]*?<\/script>/gi, "");
    if (!protectedFiles.has(file)) assert.doesNotMatch(text, /\bspecial players?\b/, `${file}: capitalize the feature name`);
    if (/(?:^|[\s>"'])Marquee(?: Player)?(?=$|[\s<.!,:;"'])|(?:^|[>\n"'])MP(?:$|[<\n"'])/im.test(text)) hits.push(file);
  }
  assert.deepEqual(hits, []);
});
check("W3 Transfer War is the only display name in editable runtime files", () => {
  const blocked = new Set(Object.values(JSON.parse(read("audit/r87-words/excluded-pr-files.json"))).flat());
  for (const folder of ["js", "data"]) for (const name of fs.readdirSync(path.join(ROOT, folder))) {
    const file = `${folder}/${name}`;
    if (!file.endsWith(".js") || blocked.has(file)) continue;
    for (const text of jsStrings(read(file))) assert.doesNotMatch(text, /transfer challenge/i, file);
  }
  const transfer = require("../../js/transferScreenV10.js");
  assert.equal(transfer.STRINGS.title, "SEASON {season} · TRANSFER WAR");
  assert.equal(transfer.STRINGS.railAriaLabel, "Transfer War progress");
});
check("W4 Gazette advertising metaphors use billboard, never Marquee", () => {
  const source = read("data/frontPages.js");
  for (const fixed of ["SPLIT THE BILLBOARD", "HONOURS BEYOND THE BILLBOARD", "season's billboard", "BILLBOARD MAGIC MAKES HISTORY"]) assert.ok(source.includes(fixed), fixed);
  assert.doesNotMatch(source, /\bmarquee\b/i);
});
check("W5 dashboard status and next action use Transfer War without changing routing", () => {
  const source = read("js/showdownUI.js");
  for (const value of ["Transfer War: ready", "Transfer War: window live", "Transfer War: signing entry", "Transfer War: guess entry", "Transfer War: complete", "TRANSFER WAR"]) assert.ok(source.includes(value), value);
  assert.ok(source.includes('createCompletionAction("HOME",'));
  assert.match(source, /START SEASON \$\{season\} TRANSFER WAR/);
  assert.doesNotMatch(source, /[Tt]ransfer [Cc]hallenge:|TRANSFER CHALLENGE/);
});
check("W6 backup import errors use the same Transfer War name", () => {
  const source = read("js/importAnalysis.js");
  assert.ok(source.includes('"Transfer War history is invalid."'));
  assert.ok(source.includes('`Transfer War ${index + 1} is not an object.`'));
});
console.log(`PASS r87 words fixes: ${checks} contracts`);
