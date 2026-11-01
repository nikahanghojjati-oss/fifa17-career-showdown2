"use strict";
// Gallery shots of screens CE2PG never opens (the Rule Book), from a plain static server of this checkout.
// Usage: node tools/gallery/static-shots.cjs OUT_DIR   (desktop 1440x900 and phone 390x844; appends to OUT_DIR/shots.jsonl)
// No Firebase: the page loads signed out, which is enough for the Rule Book.
const fs=require("node:fs");
const path=require("node:path");
const http=require("node:http");
const {chromium}=require("playwright");
const {resolveChromiumRuntime}=require("../../tests/support/chromium-runtime.cjs");
const ROOT=path.resolve(__dirname,"../..");
const OUT=path.resolve(process.argv[2]||"test-results/gallery");
const TYPES={".html":"text/html",".js":"text/javascript",".css":"text/css",".json":"application/json",".webp":"image/webp",".png":"image/png",".jpg":"image/jpeg",".svg":"image/svg+xml",".woff2":"font/woff2",".mp3":"audio/mpeg",".webmanifest":"application/manifest+json"};
const server=http.createServer((req,res)=>{
  const u=decodeURIComponent(new URL(req.url,"http://x").pathname);
  let f=path.join(ROOT,u.endsWith("/")?u+"index.html":u);
  if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);res.end();return;}
  res.writeHead(200,{"content-type":TYPES[path.extname(f)]||"application/octet-stream"});fs.createReadStream(f).pipe(res);
});
(async()=>{
  await new Promise(r=>server.listen(4799,"127.0.0.1",r));
  const rt=await resolveChromiumRuntime();
  const browser=await chromium.launch({executablePath:rt.executablePath,args:rt.args});
  const log=path.join(OUT,"shots.jsonl");
  for(const [device,viewport] of [["desktop",{width:1440,height:900}],["phone",{width:390,height:844}]]){
    const context=await browser.newContext({viewport});const page=await context.newPage();
    await page.goto("http://127.0.0.1:4799/",{waitUntil:"domcontentloaded"});
    await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:30000}).catch(()=>{});
    await page.waitForTimeout(1500);
    await page.locator("#ruleBookButton").click({timeout:10000});
    await page.waitForTimeout(2500);
    // Open card 03 (Transfer Challenge: the roulette and guessed-player lines) and bring it to the top.
    const card=page.getByText(new RegExp(process.env.RB_CARD||"^\\s*TRANSFER CHALLENGE\\s*$","i")).first();
    await card.click({timeout:5000}).catch(()=>{});
    await page.waitForTimeout(1200);
    await card.evaluate(el=>el.scrollIntoView({block:"start"})).catch(()=>{});
    await page.waitForTimeout(600);
    fs.mkdirSync(path.join(OUT,device),{recursive:true});
    const file=path.join(OUT,device,""+(process.env.RB_SLUG||"900-static-rule-book")+".png");
    await page.screenshot({path:file});
    fs.appendFileSync(log,JSON.stringify({id:"900",device,sig:"static:"+(process.env.RB_SLUG||"ruleBook"),file:path.relative(OUT,file)})+"\n");
    await context.close();
  }
  await browser.close();server.close();
  console.log("rule book shots ->",OUT);
})().catch(e=>{console.error(e);server.close();process.exit(1);});
