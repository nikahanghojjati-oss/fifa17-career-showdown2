// Optional review evidence only. Never changes a Gate route, lane record or seal.
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const SCREEN_MAP=Object.freeze({
  home:['mainMenu'],
  homeScreens:['mainMenu'],
  musicDock:['careerStatistics','transferChallenge'],
  connectPlayers:['connectPlayersScreen'],
  connectPlayersScreen:['connectPlayersScreen'],
  rulesSettings:['ruleBook','settingsOverlay'],
  rivalryLegacy:['legacy','statistics'],
  careerScreens:['careerStatistics','trophyRoom'],
  clubScreen:['clubWheelScreen'],
  transferScreen:['transferChallenge'],
  seasonFinal:['seasonEntry','standings']
});
export const VIEWPORTS=Object.freeze([
  {width:360,height:640},{width:390,height:844},{width:768,height:1024},
  {width:1366,height:768},{width:1920,height:1080}
]);
export function screensForFiles(files){
  return [...new Set(files.flatMap(file=>{
    const match=String(file).match(/^(?:css\/([^/]+)V10\.css|js\/([^/]+)V10[^/]*\.js)$/);
    return match?(SCREEN_MAP[match[1]||match[2]]||[]):[];
  }))].sort();
}

async function startSite(){
  const port=process.env.CMS_TEST_PORT||'4182';
  const server=spawn(process.execPath,['tests/support/static-server.cjs'],{
    cwd:root,env:{...process.env,CMS_TEST_PORT:port},stdio:['ignore','pipe','pipe']
  });
  try{
    await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(new Error('Screenshot site startup timed out')),10000);
      server.once('error',error=>{clearTimeout(timer);reject(error);});
      server.once('exit',code=>{clearTimeout(timer);reject(new Error(`Screenshot site exited: ${code}`));});
      server.stderr.on('data',data=>process.stderr.write(data));
      server.stdout.on('data',data=>{
        if(String(data).includes('test server listening')){clearTimeout(timer);resolve();}
      });
    });
    return {url:`http://127.0.0.1:${port}/`,stop:()=>server.kill('SIGTERM')};
  }catch(error){server.kill('SIGTERM');throw error;}
}

async function openScreen(page,screen){
  await page.evaluate(async id=>{
    let timer;
    const opening=(async()=>{
    if(id==='mainMenu')return;
    if(id==='settingsOverlay'){
      document.getElementById('settingsButton').click();
    }else if(id==='connectPlayersScreen'){
      await window.loadRuntimeScript('connect-players-v10','js/connectPlayersScreenV10.js',()=>Boolean(window.CareerModeConnectPlayersScreenV10));
      await window.CareerModeConnectPlayersScreenV10.open({sync:false});
    }else if(['legacy','statistics','careerStatistics','trophyRoom','ruleBook'].includes(id)){
      await window.openOptionalModule(id);
      if(id==='statistics'&&!document.getElementById(id))window.createStatisticsScreen();
    }else if(id==='standings'){
      await window.loadRuntimeScript('v10-season-final','js/seasonFinalV10.js',()=>Boolean(window.CareerModeSeasonFinalV10));
      await window.CareerModeSeasonFinalV10.install();
      await window.CareerModeV10Screens.navigate('standings');
    }else{
      await window.navigateTo(id);
    }
    // As in football-visual-audit, expose a read-only screen when normal navigation needs
    // a live showdown. Use its real unavailable/empty rendering, never invented manager data.
    const host=document.getElementById(id);
    if(host?.classList.contains('hidden')){
      document.querySelectorAll('main .screen').forEach(el=>{el.classList.add('hidden');el.setAttribute('aria-hidden','true');});
      host.classList.remove('hidden');host.setAttribute('aria-hidden','false');
      window.getActiveScreenName=()=>id;
      window.__gatePresentationOnly=true;
      document.getElementById('appRuntimeNotice')?.remove();
      const modules={
        statistics:['rivalry-legacy-v10','js/rivalryLegacyV10.js','CareerModeRivalryLegacyV10'],
        clubWheelScreen:['club-screen-v10','js/clubScreenV10.js','CareerModeClubScreenV10'],
        transferChallenge:['transfer-screen-v10','js/transferScreenV10.js','CareerModeTransferScreenV10'],
        seasonEntry:['season-final-v10','js/seasonFinalV10.js','CareerModeSeasonFinalV10'],
        standings:['season-final-v10','js/seasonFinalV10.js','CareerModeSeasonFinalV10']
      };
      const entry=modules[id];
      if(entry){
        const [key,file,api]=entry;
        await window.loadRuntimeScript(key,file,()=>Boolean(window[api]));
        if(id==='statistics')await window[api].mount('rivalryStatistics',()=>null);
        else await window[api].install();
        // r87 BUG-6: with no live showdown, Club Assignment only draws its marble frame when a presentation role is set;
        // without it the Gate captured the legacy grey layout.
        if(id==='clubWheelScreen'&&!host.dataset.sharedPresentationRole)host.dataset.sharedPresentationRole='playerOne';
        await window.CareerModeV10Screens.show(id);
      }
    }
    })();
    try{await Promise.race([opening,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(`Opening ${id} timed out`)),15000);})]);}
    finally{clearTimeout(timer);}
  },screen);
  await page.locator(`#${screen}`).waitFor({state:'visible',timeout:20000});
  if(screen==='settingsOverlay')await page.waitForFunction(()=>window.CareerModeV10Screens.isMounted('settingsOverlay'),null,{timeout:20000});
  await page.waitForFunction(id=>!document.getElementById(id)?.hasAttribute('data-v10-pending'),screen,{timeout:20000});
  await page.evaluate(async id=>{
    await document.fonts.ready;
    const host=document.getElementById(id);
    await Promise.race([Promise.all([...host.querySelectorAll('img')].map(img=>img.decode().catch(()=>{}))),new Promise(resolve=>setTimeout(resolve,3000))]);
    window.scrollTo(0,0);
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  },screen);
}

export async function captureScreenshots({files,out='gate-shots'}={}){
  const screens=screensForFiles(files);
  if(!screens.length){console.log('Gate screenshots: no changed V10 screens');return {screens,shots:[],errors:[]};}
  const output=path.resolve(root,out);
  fs.mkdirSync(output,{recursive:true});
  const report={files,screens,viewports:VIEWPORTS,shots:[],errors:[],offline:true,presentationOnly:[],state:'Fresh signed-out context; no live showdown or manager data'};
  let site,browser;
  try{
    // This app is shipped as a static site; use the same built shell/server and Chromium as visual audits.
    site=await startSite();
    const {chromium}=await import('playwright');
    const {resolveChromiumRuntime}=await import('../tests/support/chromium-runtime.cjs');
    const runtime=await resolveChromiumRuntime();
    browser=await chromium.launch({headless:true,...runtime,args:runtime.args.filter(arg=>arg!=='--single-process')});
    for(const viewport of VIEWPORTS){
      for(const screen of screens){
        console.log(`Gate screenshot starting: ${screen} ${viewport.width}x${viewport.height}`);
        const context=await browser.newContext({viewport,deviceScaleFactor:1,reducedMotion:'reduce',serviceWorkers:'block',locale:'en-US'});
        try{
          // Offline here means no provider/CDN/media traffic; only the local built site is reachable.
          await context.route('**/*',route=>{
            const url=new URL(route.request().url());
            if(url.origin!==new URL(site.url).origin)return route.abort();
            // Service workers are blocked for evidence; suppress their optional installer only.
            if(url.pathname==='/js/offlineApp.js')return route.fulfill({contentType:'application/javascript',body:'window.getOfflineAppDiagnostics=()=>({isolatedGateScreenshot:true});'});
            return route.continue();
          });
          await context.routeWebSocket(/.*/,socket=>socket.close());
          const page=await context.newPage();
          await page.goto(site.url,{waitUntil:'domcontentloaded'});
          await page.locator('#loadingScreen').waitFor({state:'hidden',timeout:20000});
          await page.waitForFunction(()=>window.CareerModeV10Screens?.isMounted('mainMenu'),null,{timeout:20000});
          await openScreen(page,screen);
          const name=`${screen}-${viewport.width}x${viewport.height}.png`;
          await page.screenshot({path:path.join(output,name),animations:'disabled',fullPage:false});
          report.shots.push(name);
          if(await page.evaluate(()=>Boolean(window.__gatePresentationOnly)))report.presentationOnly.push(name);
          console.log(`Gate screenshot: ${name}`);
        }catch(error){
          report.errors.push({screen,viewport,message:error.message});
          console.error(`Gate screenshot unavailable: ${screen} ${viewport.width}x${viewport.height}: ${error.message}`);
        }finally{await context.close();}
      }
    }
  }finally{
    try{await browser?.close();}finally{site?.stop();fs.writeFileSync(path.join(output,'report.json'),`${JSON.stringify(report,null,2)}\n`);}
  }
  if(report.errors.length)throw new Error(`${report.errors.length} optional screenshots unavailable; see gate-shots/report.json`);
  return report;
}

async function main(){
  const args=process.argv.slice(2),options={};
  for(let i=0;i<args.length;i+=2){
    if(!['--route','--files-file','--out'].includes(args[i])||!args[i+1])throw new Error(`Unknown screenshot argument: ${args[i]}`);
    options[args[i].slice(2)]=args[i+1];
  }
  const files=options.route?JSON.parse(fs.readFileSync(options.route,'utf8')).files:
    options['files-file']?fs.readFileSync(options['files-file'],'utf8').split(/\r?\n/).filter(Boolean):null;
  if(!Array.isArray(files)||files.some(file=>typeof file!=='string'))throw new Error('Pass changed files with --route or --files-file');
  await captureScreenshots({files,out:options.out});
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error.message);process.exitCode=1;});
