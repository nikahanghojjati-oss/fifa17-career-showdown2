const fs=require('node:fs'),{spawn}=require('node:child_process');
const ROOT=require('node:path').resolve(__dirname,'../../../../../..');
const {chromium}=require(ROOT+'/node_modules/playwright');
const {resolveChromiumRuntime}=require(ROOT+'/tests/support/chromium-runtime.cjs');
(async()=>{
 const server=spawn(process.execPath,[ROOT+'/tests/support/static-server.cjs'],{env:{...process.env,CMS_TEST_PORT:'4197'},stdio:'ignore'});
 let browser;
 try{
  await new Promise(r=>setTimeout(r,500));
  const runtime=await resolveChromiumRuntime();browser=await chromium.launch({executablePath:runtime.executablePath,args:runtime.args,headless:true});
  const context=await browser.newContext({viewport:{width:393,height:660}});
  await context.addInitScript(()=>{
   window.__startupProbe=[];const original=window.setTimeout;
   window.setTimeout=function(callback,delay,...args){
    const stack=new Error().stack||'';
    if(stack.includes('initializeOnlinePlayerEntry')){
     const wrapped=function(...values){window.__startupProbe.push({event:'identity-bootstrap-timer',readyState:document.readyState,loader:typeof loadRuntimeScript,reporter:typeof window.reportApplicationError,time:performance.now()});return callback(...values);};
     return original.call(this,wrapped,delay,...args);
    }
    return original.call(this,callback,delay,...args);
   };
  });
  await context.route('**/js/optionalModules.js*',async route=>{await new Promise(r=>setTimeout(r,500));await route.continue();});
  const page=await context.newPage();await page.goto('http://127.0.0.1:4197/',{waitUntil:'domcontentloaded'});
  await page.locator('#loadingScreen').waitFor({state:'hidden',timeout:30000});
  await page.locator('#newShowdown').click();
  await page.waitForTimeout(1000);
  const result=await page.evaluate(()=>({probe:window.__startupProbe,loader:typeof loadRuntimeScript,reporter:typeof window.reportApplicationError,identityPresent:Boolean(window.CareerModeOnlinePlayerIdentity),bootstrapMarked:window.__cmsOnlinePlayerEntryBootstrap,screen:[...document.querySelectorAll('.screen:not(.hidden)')].map(x=>x.id),badge:document.getElementById('onlinePlayerIdentityBadge')?.textContent||null,signInVisible:[...document.querySelectorAll('button')].some(x=>x.textContent.trim()==='SIGN IN WITH GOOGLE'&&getComputedStyle(x).display!=='none')}));
  fs.writeFileSync(require('node:path').join(__dirname,'startup-diagnostic.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
 }finally{if(browser)await browser.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
