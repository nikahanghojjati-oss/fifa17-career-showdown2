#!/usr/bin/env node
"use strict";

const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
let n=0;
function test(name,fn){try{fn();console.log(`ok ${++n} - ${name}`);}catch(error){console.error(`not ok ${++n} - ${name}`);throw error;}}

const html=read("index.html"),binder=read("js/homeScreensV10.js"),soundtrack=read("visual-assets/v10_1/home/soundtrack.js");

test("Home keeps every product-owned destination id",()=>{
  for(const id of ["continueCareer","newShowdown","legacyButton","careerStatisticsButton","ruleBookButton","settingsButton"]){
    assert.match(html,new RegExp(`id=["']${id}["']`));assert.match(binder,new RegExp(id));
  }
  assert.match(binder,/trophyRoomButton/);
});
test("Daniel and Nik keep the authoritative start and join copy",()=>{
  assert.match(html,/START A SHOWDOWN/);assert.match(read("js/onlinePlayerIdentity.js"),/JOIN DANIEL(?:&apos;|&#39;|['’])S SHOWDOWN/i);
  assert.match(binder,/decorateHome\(frame,host\)/);assert.doesNotMatch(binder,/\.menuTileLabel[^\n]*textContent/);
});
test("Audius playlist is inert until the Play tap",()=>{
  assert.match(soundtrack,/function play\(\)/);assert.match(soundtrack,/a\.src = streamUrl\(t\)/);
  assert.doesNotMatch(soundtrack,/fetch\s*\(/);assert.match(soundtrack,/preload = "none"/);
  assert.match(binder,/https:\/\/api\.audius\.co\/v1/);assert.equal((binder.match(/audiusTrackId:/g)||[]).length,4);
});
test("one long-lived audio element survives navigation away from Home",()=>{
  assert.match(soundtrack,/v10PersistentMedia/);assert.match(soundtrack,/document\.body\.appendChild\(persistent\)/);
  assert.doesNotMatch(soundtrack,/ui\.card\.appendChild\(audio\)/);
});
test("the old YouTube player is replaced only by lazy Home code",()=>{
  assert.match(html,/id="menuMusicPlayer"/);assert.match(binder,/card\.innerHTML=/);
  assert.doesNotMatch(binder,/youtube\.com|youtube-nocookie\.com|youtu\.be/i);
  assert.match(read("js/ssjr.js"),/v10-home-screens/);
});
test("Loading preserves Reus and publishes the exact accessible credit links",()=>{
  assert.match(html,/assets\/marco-reus-2015-cc-by\.webp/);
  assert.match(binder,/Marco Reus photo: <a href="https:\/\/www\.flickr\.com\/photos\/foto_db\/16204330530\/">Tim Reckmann<\/a> · <a href="https:\/\/creativecommons\.org\/licenses\/by\/2\.0\/">CC BY 2\.0<\/a> · Cropped for display/);
  assert.match(binder,/dataset\.nav="none"/);assert.match(binder,/loading\/assets\/LOGO_CM17_WORDMARK_LOADING_V1\.webp/);
});
test("both screens register through the shared lazy loader",()=>{
  assert.match(binder,/V\.register\("mainMenu"/);assert.match(binder,/V\.register\("loadingScreen"/);
  assert.match(binder,/css:\["home\/home\.css"\]/);assert.match(binder,/css:\["loading\/loading\.css"\]/);
});

console.log(`1..${n}`);
