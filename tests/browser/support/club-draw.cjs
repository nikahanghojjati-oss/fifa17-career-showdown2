"use strict";
// R94-02: the Club Assignment spin and stop, driven through the real screen by every browser journey (CE2PG, the Gate's
// two-manager journey, the r79 audit, fault injection). A draw 2 Setup has no OPEN CLUB PACKS tap: Daniel's device deals
// the candidates by itself, both balls turn, each manager taps STOP on his own device (#continueClubAssignment), and his
// club is named under his ball (#clubNameOne / #clubNameTwo, .is-revealed) once it rests.
// r95: the button reads CONTINUE TO BALL GAME; the older names stay accepted for runs that start on an older build.
const CONTINUE_TO_CLUBS=/^CONTINUE TO (BALL GAME|CLUB PACKS|CLUB DRAW)$/;

async function waitContinueToClubs(page,timeout=30000){
  await page.waitForFunction(()=>/^CONTINUE TO (BALL GAME|CLUB PACKS|CLUB DRAW)$/.test(document.getElementById("spinLeague")?.textContent||""),null,{timeout});
}
// R98-01 League Roulette: four balls, Daniel, Nik, Daniel, Nik, each dropped from his own phone once the ball before it has
// rested on that phone (#spinLeague reads DROP BALL there, WAITING FOR ... on the other). Daniel's first ball draws the
// league; the clubs follow the fourth. A Setup opened before the roulette goes straight on to CONTINUE after ball 1.
async function playLeagueRoulette(daniel,nik,timeout=60000){
  await daniel.page.locator("#spinLeague").click({timeout:30000});
  for(const m of [nik,daniel,nik]){
    const next=await m.page.waitForFunction(()=>{const b=document.getElementById("spinLeague"),t=(b?.textContent||"").trim();if(/^CONTINUE TO /.test(t))return "done";return t==="DROP BALL"&&!b.disabled?"drop":false;},null,{timeout});
    if(await next.jsonValue()==="done")break;
    await m.page.locator("#spinLeague").click({timeout:30000});
  }
  await waitContinueToClubs(daniel.page,timeout);
}
async function isDraw(page){return page.evaluate(()=>document.getElementById("clubWheelScreen")?.dataset.clubDraw==="spin").catch(()=>false);}
async function waitDraw(page,timeout=45000){await page.waitForFunction(()=>document.getElementById("clubWheelScreen")?.dataset.clubDraw==="spin",null,{timeout});}
// STOP opens once the season length is locked and this manager's ball turns at full speed.
async function waitStop(page,timeout=45000){
  await page.waitForFunction(()=>{const b=document.getElementById("continueClubAssignment");return Boolean(b&&!b.classList.contains("hidden")&&!b.disabled&&b.textContent.trim()==="STOP");},null,{timeout});
}
async function stop(page,timeout=45000){await waitStop(page,timeout);await page.locator("#continueClubAssignment").click({timeout:30000});}
// "3d" (the football scene) or "flat" (the stand-in without WebGL2), as the step drew it on this page.
async function kind(page){return page.evaluate(()=>document.getElementById("clubDrawStage")?.dataset.drawKind||"").catch(()=>"");}
async function names(page){return page.evaluate(()=>[document.getElementById("clubNameOne")?.textContent?.trim(),document.getElementById("clubNameTwo")?.textContent?.trim()]);}
async function waitBothRested(page,timeout=45000){
  await page.waitForFunction(()=>["clubCardOne","clubCardTwo"].every(id=>document.getElementById(id)?.classList.contains("is-revealed"))&&["clubNameOne","clubNameTwo"].every(id=>{const t=document.getElementById(id)?.textContent?.trim();return t&&t!=="?";}),null,{timeout});
}
// What Firebase holds for this Setup (the presentation's own state): stops in confirm order, candidates and clubs.
async function setupState(page){
  return page.evaluate(()=>{const s=window.CareerModeProductionSharedShowdownSetup?.getState?.()?.setup;return s?{phase:s.phase,stops:s.stops||null,confirmedRoles:s.confirmedRoles||[],candidates:s.candidates||null,clubs:s.clubs||null}:null;}).catch(()=>null);
}
// The whole draw for two managers: both STOP (Daniel first unless danielFirst is false), both balls rest on both phones,
// and both phones name the same two clubs. Returns [Daniel's club, Nik's club].
async function playClubDraw(daniel,nik,{danielFirst=true,timeout=60000}={}){
  for(const m of [daniel,nik])await waitDraw(m.page,timeout);
  for(const m of [daniel,nik])await waitStop(m.page,timeout);
  // Read while the balls turn: once Career Start opens the scene is let go.
  const kinds=[await kind(daniel.page),await kind(nik.page)];
  const order=danielFirst?[daniel,nik]:[nik,daniel];
  for(const m of order)await stop(m.page,timeout);
  for(const m of [daniel,nik])await waitBothRested(m.page,timeout);
  const a=await names(daniel.page),b=await names(nik.page);
  if(a[0]!==b[0]||a[1]!==b[1])throw new Error(`the two phones name different clubs: ${JSON.stringify(a)} vs ${JSON.stringify(b)}`);
  a.kinds=kinds;
  return a;
}

module.exports={playLeagueRoulette,CONTINUE_TO_CLUBS,waitContinueToClubs,isDraw,waitDraw,waitStop,stop,kind,names,waitBothRested,setupState,playClubDraw};
