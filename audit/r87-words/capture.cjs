process.env.CMS_CHROMIUM_MULTI_CONTEXT = '1';
const root=require('node:path').resolve(__dirname,'../..');
const {chromium}=require(root+'/node_modules/playwright');
const {resolveChromiumRuntime}=require(root+'/tests/support/chromium-runtime.cjs');
const {SCREENS,openScreen}=require(root+'/tests/browser/r80-short-screens-audit.cjs');
const fs=require('fs');
(async()=>{
 const browser=await chromium.launch({headless:true,...await resolveChromiumRuntime()}); const out=[];
 try {for(const [width,height] of [[1920,1080],[393,852]]) {
 const ctx=await browser.newContext({viewport:{width,height},isMobile:width<900,hasTouch:width<900});
 await ctx.route('**/*',r=>new URL(r.request().url()).origin==='http://127.0.0.1:4173'?r.continue():r.abort());
 const page=await ctx.newPage();
 for(const key of Object.keys(SCREENS)) {
 await openScreen(page,key);
 const sel='.trophyTab,#sdgViewShowdown,#sdgViewCareer,[id^=rvTab],input.phoneTabControl,input.finalWinnerTabInput,input.season-phone-tab-input,input#connectPlayersDanielTab,input#connectPlayersNikTab,input#connectPlayersConnectionTab';
 const tabs=await page.evaluate(({host,sel})=>[...document.getElementById(host).querySelectorAll(sel)].map((e,i)=>({e,i})).filter(({e})=>(e.labels?.[0]||e).checkVisibility({checkVisibilityCSS:true})).map(({i})=>i),{host:SCREENS[key].host,sel});
 for(const tab of [null,...tabs]) {
 if(tab!==null) {await page.evaluate(({host,sel,i})=>{const e=document.getElementById(host).querySelectorAll(sel)[i];(e.labels?.[0]||e).click()},{host:SCREENS[key].host,sel,i:tab});await page.waitForTimeout(200)}
 const text=await page.locator('#'+SCREENS[key].host).innerText();
 out.push({screen:key,viewport:`${width}x${height}`,tab,text});
 }
 console.log('read',key,width,height);
 }
 await ctx.close();
 }}finally{await browser.close();fs.writeFileSync(root+'/audit/r87-words/screen-text.json',JSON.stringify(out,null,2)+'\n')}
})().catch(e=>{console.error(e);process.exitCode=1});
