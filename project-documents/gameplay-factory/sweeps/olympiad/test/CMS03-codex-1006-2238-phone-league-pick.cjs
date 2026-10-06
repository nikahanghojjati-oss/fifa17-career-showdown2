'use strict';
// Run from the repository root, with node tests/support/static-server.cjs running.
// A normal tap on a previous-league choice must reach that choice on a phone.
const h=require('./codex-1006-2238-harness.cjs');
(async()=>{
 const browser=await h.chromium.launch({executablePath:process.env.CMS_CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
  const {game,pages:[d,n]}=await h.beginPair(browser,3,1);
  await h.lock(d,game,'playerOne','guesses');await h.lock(n,game,'playerTwo','guesses');await h.refresh(n);
  await n.locator('#p2Signing1Name').fill('Spanish league signing');await n.locator('#p2Signing1League').fill('Primera División');
  const option=n.locator('#p2Signing1League').locator('..').locator('[data-option-id="spain-primera-division"]');
  await option.scrollIntoViewIfNeeded();await n.waitForTimeout(500);
  const hit=await option.evaluate(node=>{const r=node.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,target=document.elementFromPoint(x,y);return {viewport:{width:innerWidth,height:innerHeight},choice:node.textContent,rect:r.toJSON(),targetTag:target?.tagName,targetId:target?.id,targetText:target?.textContent,targetIsChoice:target===node||node.contains(target)}});
  let clicked=true;try{await option.click({timeout:2000})}catch(e){clicked=false;console.log('TAP FAILED:',e.message.split('\n')[0])}
  console.log(JSON.stringify({...hit,clicked,signingLeague:await n.locator('#p2Signing1League').getAttribute('data-canonical-id')},null,2));
  h.assert.equal(hit.targetIsChoice,true,'A previous-league choice must be tappable; the phone footer must not cover it.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
