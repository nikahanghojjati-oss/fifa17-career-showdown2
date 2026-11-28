"use strict";
// r100 hunt H3 F1 (P2): at 1920x866 the Champion (Final Winner) room and the Golden Showdown stage left about 190 px flat bands
// left and right in every clubhouse (40 px at 1920x1035): both drew the 1536x864 board room at the window's height, so any
// window wider than 16:9 was not covered. There is no wider room, so a wider window now draws the room at its width
// (cover), its top still where the hair clears the top bar by 10px, and the extra height comes off the counter at the bottom.
// Every slot is placed in plate pixels, so it moves with the room. The room grows to at most 1.4x the height fit (2.49:1,
// every 21:9 window): past that the Final Winner plaque would have to ride up over the two totals. The browser proof is
// tests/browser/r100-board-fill-audit.cjs (bands measured with the room swapped for a flat colour, plus the face, result and
// SEE FINAL WINNER checks), in Wooden, Platinum and Ruby at 1920x866, 1920x1035, 1366x768 and 390x844.
//   F1 Final Winner: from 16:9 on desktop windows, one plate pixel is max(height fit, min(width fit, 1.4x height fit)); the
//      drop, the background size and every slot follow it
//   F2 Golden: the same plate pixel, the same drop (so SEE FINAL WINNER changes the words, not the room); the strip and the
//      button ride up to stay on screen, the trophy stands on them and stays under the title lines
//   F3 16:9 and narrower, upright windows, sideways phones and upright phones keep their rules (the new rules are inside a
//      min-aspect-ratio 16/9, min-height 501px block that comes after the height fit and before the upright-window rule)
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const ROOT=path.resolve(__dirname,"../..");
const src=fs.readFileSync(path.join(ROOT,"js/seasonFinalV10.js"),"utf8");
let n=0;const ok=(id,label)=>{n+=1;console.log(`ok ${id} ${label}`);};
const WIDE="@media (min-width:901px) and (min-height:501px) and (min-aspect-ratio:16/9) {";
const blocks=[];{let i=-1;while((i=src.indexOf(WIDE,i+1))>=0){let depth=0,j=i;for(;j<src.length;j++){if(src[j]==="{")depth++;else if(src[j]==="}"){depth--;if(!depth)break;}}blocks.push({at:i,body:src.slice(i,j+1)});}}
assert.equal(blocks.length,2,"two wide-window blocks: Golden and Final Winner");
const golden=blocks.find(b=>b.body.includes(".v10GoldenStage")),final=blocks.find(b=>b.body.includes("v10FinalMode"));
assert.ok(golden&&final,"one block for each screen");
const has=(body,re,msg)=>assert.match(body.replace(/\s+/g," "),re,msg);

// F1
has(final.body,/--fw-k:max\(calc\(100svh \/ 864\),min\(calc\(100vw \/ 1536\),calc\(100svh \/ 864 \* 1\.4\)\)\);/,"Final Winner: plate pixel = max(height fit, min(width fit, 1.4x height fit))");
has(final.body,/--fw-drop:max\(0px,calc\(var\(--sd-nav-top-h,52px\) \+ 10px - 49 \* var\(--fw-k\)\)\);/,"Final Winner: the hair (plate row 49) still clears the top bar by 10px");
has(final.body,/background-size:auto calc\(864 \* var\(--fw-k\)\);/,"Final Winner: the room is drawn at the plate pixel, not the window height");
const fitAt=src.indexOf("@media (min-width:901px) {\n #app main:has(> #seasonEntry.seasonScreenV10.v10FinalMode:not(.hidden)) {\n  background-color:#1d1a16;");
const uprightAt=src.indexOf("@media (min-width:901px) and (orientation:portrait) {\n #app main:has(> #seasonEntry.seasonScreenV10.v10FinalMode:not(.hidden)) {\n  --fw-k:calc(100vw / 1536);");
assert.ok(fitAt>0&&uprightAt>0&&fitAt<final.at&&final.at<uprightAt,"Final Winner: after the height fit (so it wins on wide windows), before the upright-window rule (so that one still wins upright)");
assert.ok(/--fw-rt:min\(var\(--fw-r0\),calc\(100% - var\(--fw-rh\) - var\(--fw-bh\) - var\(--fw-th\) - 6px\)\);/.test(src),"Final Winner: the plaque and buttons still ride up to stay on screen");
ok("F1","Final Winner covers windows wider than 16:9 (to 2.49:1): plate pixel, hair drop and room size follow it; plaque and buttons stay on screen");

// F2
const g=golden.body.replace(/\s+/g," ");
has(g,/--gk:max\(calc\(var\(--gh\) \/ 864\),min\(calc\(100vw \/ 1536\),calc\(var\(--gh\) \/ 864 \* 1\.4\)\)\);/,"Golden: the same plate pixel as Final Winner");
has(g,/--gdrop:max\(0px,calc\(var\(--sd-nav-top-h,52px\) \+ 10px - 49 \* var\(--gk\)\)\);/,"Golden: the same drop as Final Winner");
has(g,/--gcount:min\(calc\(var\(--glip\) \+ 12px\),calc\(var\(--gh\) - 176px\)\);/,"Golden: the strip sits under the lip, or rides up to keep SEE FINAL WINNER on screen");
has(g,/height:max\(var\(--gh\),calc\(var\(--gcount\) \+ 176px\)\);/,"Golden: the stage holds the strip and the button");
has(g,/background-size:auto calc\(864 \* var\(--gk\)\);/,"Golden: the room is drawn at the plate pixel");
has(g,/\.goldenCounter \{ top:var\(--gcount\); \}/,"Golden: the counter follows");
has(g,/--gcup-b:min\(var\(--glip\),calc\(var\(--gcount\) - 8px\)\);/,"Golden: the trophy stands on the lip, or on the raised strip");
has(g,/--gcup-h:min\(calc\(300 \* var\(--gk\)\),calc\(\(var\(--gcup-b\) - var\(--sd-nav-top-h,52px\) - 190px\) \* 768 \/ 744\)\);/,"Golden: the trophy stays under the title lines");
const gFitAt=src.indexOf("@media (min-width:901px) and (min-height:501px), (min-width:901px) and (orientation:portrait), (min-height:501px) and (orientation:landscape) {\n #app #seasonEntry .v10GoldenStage {");
const gPhoneAt=src.indexOf("@media (max-width:900px) and (orientation:portrait) {\n #app #seasonEntry .v10GoldenStage {");
assert.ok(gFitAt>0&&gPhoneAt>0&&gFitAt<golden.at&&golden.at<gPhoneAt,"Golden: after the height fit, before the phone rules");
ok("F2","Golden covers the same windows with the same room; the strip and SEE FINAL WINNER stay on screen, the trophy under the title");

// F3
for(const b of blocks){
  assert.doesNotMatch(b.body,/filter|opacity|brightness|linear-gradient\(#000|#000[0-9a-f]{1,2}\b/i,"no dimming or shading added");
  assert.doesNotMatch(b.body,/url\(/,"no new art: the same room pictures");
}
ok("F3","only windows wider than 16:9 and at least 501px tall change; no dimming, no new picture");
console.log(`PASS r100 board fill contracts (${n} checks)`);
