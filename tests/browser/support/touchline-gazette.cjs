"use strict";
// r87 Touchline Gazette in browser journeys: CONTINUE TO SEASON N+1 on Season Results, and BACK TO SHOWDOWN HOME or REMATCH
// on Final Winner, now open the Gazette's own page first; its one CONTINUE (#touchlineGazetteContinue) then runs exactly the
// step the tapped button ran. A paper is shown once per phone (careerModeShowdown.gazetteSeen.v1, through js/storage.js).
//   passGazette(page, kind)  after the tap: waits for the paper (or for the screen to change without one), checks it is the
//                            expected edition, taps its CONTINUE and returns the paper's key (null when none showed).
//   tapGazetteIfShown(page)  for loops that press whatever exit is visible: taps the paper's CONTINUE if it is up.
//   gazetteSeen(page)        the papers this phone has shown, in order.
const SEEN_KEY="careerModeShowdown.gazetteSeen.v1";

async function passGazette(page,kind,timeout=20000){
  const handle=await page.waitForFunction(()=>{
    const b=document.getElementById("touchlineGazetteContinue");
    if(b&&b.getClientRects().length&&!b.disabled)return "paper";
    const screen=typeof window.getActiveScreenName==="function"?window.getActiveScreenName():null;
    return screen&&screen!=="seasonEntry"?"left":false;
  },null,{timeout});
  if(await handle.jsonValue()!=="paper")return null;
  const shown=await page.evaluate(()=>({kind:document.documentElement.dataset.gazette||null,key:document.getElementById("touchlineGazette")?.dataset.gazetteKey||null,headline:document.querySelector("#touchlineGazette .cmx-paper__headline")?.textContent||""}));
  if(kind&&shown.kind!==kind)throw new Error(`expected the ${kind} Gazette, saw ${shown.kind}`);
  if(!shown.headline.trim()||/[{}]/.test(shown.headline))throw new Error(`the Gazette printed no real headline: "${shown.headline}"`);
  await page.locator("#touchlineGazetteContinue").click({timeout:10000});
  await page.waitForFunction(()=>!document.getElementById("touchlineGazette")||document.getElementById("touchlineGazetteContinue")?.disabled,null,{timeout:10000});
  return shown.key;
}

async function tapGazetteIfShown(page){
  const b=page.locator("#touchlineGazetteContinue");
  if(!(await b.isVisible().catch(()=>false))||await b.isDisabled().catch(()=>true))return false;
  await b.click({timeout:5000}).catch(()=>{});
  return true;
}

async function gazetteSeen(page){
  return page.evaluate(key=>{try{const v=JSON.parse(localStorage.getItem(key)||"[]");return Array.isArray(v)?v:[];}catch(_error){return [];}},SEEN_KEY);
}

module.exports={SEEN_KEY,passGazette,tapGazetteIfShown,gazetteSeen};
