const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {chromium} = require('playwright');
const {resolveChromiumRuntime} = require('../support/chromium-runtime.cjs');

module.exports = async function auditUpdateBootstrap(){
  const root = path.resolve(__dirname, '../..');
  const latest = fs.readFileSync(path.join(root, 'service-worker.js'), 'utf8').match(/const RUNTIME_REVISION = "([^"]+)"/)[1];
  let old = true;
  const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.webp':'image/webp'};
  const server = http.createServer((req,res) => {
    const requested = new URL(req.url, 'http://localhost').pathname;
    const file = requested === '/' ? 'index.html' : requested.slice(1);
    try{
      let bytes = fs.readFileSync(path.join(root,file));
      if(old && file === 'service-worker.js') bytes = fs.readFileSync(path.join(__dirname,'../fixtures/service-worker-r29.js'));
      else if(old && ['.js','.html','.webmanifest'].includes(path.extname(file)) && file !== 'production-authorization-acceptance.html') bytes = Buffer.from(bytes.toString().replaceAll(latest, '1.9.1-r29'));
      res.writeHead(200,{'content-type':mime[path.extname(file)] || 'application/octet-stream','cache-control':'no-store'});res.end(bytes);
    }catch{res.writeHead(404);res.end();}
  });
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const url = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch(await resolveChromiumRuntime());
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  try{
    await page.addInitScript(() => {window.updateEntryStorage = {...localStorage};});
    await page.goto(url);
    await page.waitForFunction(() => navigator.serviceWorker.controller, {timeout:60000});
    assert.match(await page.locator('meta[name="app-asset-revision"]').getAttribute('content'), /r29$/);
    old = false;
    await page.goto(`${url}production-authorization-acceptance.html?update=1`);
    await page.getByRole('button',{name:'UPDATE AND RETURN TO GAME'}).waitFor();
    assert.equal(await page.evaluate(() => typeof window.CareerModeProductionFirebaseRuntime), 'undefined', 'Recovery mode must not load provider runtime');
    const snapshot = await page.evaluate(() => {
      for(const key of ['careerModeShowdown.saveLibrary','careerModeShowdown.legacyShowdowns','careerModeShowdown.preferences','careerModeShowdown.testDeviceBinding'])localStorage.setItem(key,`preserve-exact-${key}`);
      sessionStorage.setItem('update-session-proof','preserved');
      return {...localStorage};
    });
    await page.getByRole('button',{name:'UPDATE AND RETURN TO GAME'}).click();
    await page.waitForURL(url,{timeout:120000});
    assert.equal(await page.locator('meta[name="app-asset-revision"]').getAttribute('content'), latest);
    assert.deepEqual(await page.evaluate(() => window.updateEntryStorage), snapshot, 'Every saved byte must survive the upgrade before app startup');
    assert.equal(await page.evaluate(() => sessionStorage.getItem('update-session-proof')), 'preserved');
    assert.equal(errors.length,0,errors.join('\n'));
    console.log('PASS r29 worker -> latest verified shell through the network-only recovery entry; storage and session preserved; no provider code loaded.');
  }finally{
    await context.close();await browser.close();await new Promise(resolve=>server.close(resolve));
  }
};
if(require.main===module)module.exports().catch(error=>{console.error(error);process.exitCode=1;});
