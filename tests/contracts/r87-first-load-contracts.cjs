// r87 first load (thread "Speed up first load and bundle size"). Measured on a 1.6 Mbps / 150 ms phone link with 4x CPU:
// the service worker's install precache (about 4 MB, again on every release) shared the link with Home and held the Reus
// loading screen ~4 s longer, and the page waited on a render-blocking stylesheet from fonts.googleapis.com.
// 1. The worker is registered (and its update check runs) only after the loading screen has handed over, bounded at 20 s.
// 2. Barlow Condensed comes from this site: the same Google Fonts v13 files and @font-face rules, all precached.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"../.."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const html=read("index.html"),offline=read("js/offlineApp.js"),sw=read("service-worker.js"),fonts=read("assets/fonts/barlow-condensed.css");

// 1a. Registration is chained behind the handover; nothing else at startup registers the worker.
assert.match(offline,/afterStartupHandover\(\)\.then\(registerOfflineApplication\)\.catch\(/,"startup registration waits for the handover");
assert.equal((offline.match(/(?<!function )registerOfflineApplication\(\)/g)||[]).length,1,"only the Settings update check registers at once");
// 1b. Behaviour of the handover wait, run in a small fake page.
const fnSrc=offline.slice(offline.indexOf("function afterStartupHandover(){"),offline.indexOf("async function registerOfflineApplication(){"));
function run(loading,{idle=true,advance=0}={}){
  let now=1000;const timers=[];const ctx={Date:{now:()=>now},document:{getElementById:id=>id==="loadingScreen"?loading:null},
    setTimeout:(fn,ms)=>{timers.push({fn,at:now+ms});return timers.length;},Promise};
  if(idle)ctx.requestIdleCallback=(fn)=>timers.push({fn,at:now,idle:true});
  vm.createContext(ctx);vm.runInContext(fnSrc+";this.wait=afterStartupHandover;",ctx);
  let resolved=false;ctx.wait().then(()=>{resolved=true;});
  const step=async()=>{timers.sort((a,b)=>a.at-b.at);const t=timers.shift();if(!t)return false;now=Math.max(now,t.at);t.fn();await Promise.resolve();await Promise.resolve();return true;};
  return {step,isResolved:()=>resolved,setNow:v=>{now=v;},timers,get now(){return now;}};
}
(async()=>{
  // Loading screen still up: not resolved after several polls; resolves once it is hidden.
  const loading={hidden:false};const a=run(loading);
  for(let i=0;i<8;i++)await a.step();
  assert.equal(a.isResolved(),false,"no registration while the loading screen is up");
  loading.hidden=true;for(let i=0;i<4&&!a.isResolved();i++)await a.step();
  assert.equal(a.isResolved(),true,"registers once the loading screen has handed over");
  // A loading screen that never leaves: the 20 s bound lets registration go ahead anyway.
  const stuck=run({hidden:false});let guard=0;while(!stuck.isResolved()&&guard++<200)await stuck.step();
  assert.equal(stuck.isResolved(),true,"bounded wait");assert.ok(stuck.now>=1000+20000&&stuck.now<1000+21000,`gave up near 20 s (${stuck.now-1000} ms)`);
  // No loading screen element and no requestIdleCallback: still resolves.
  const none=run(null,{idle:false});guard=0;while(!none.isResolved()&&guard++<10)await none.step();
  assert.equal(none.isResolved(),true,"no loading screen: registers");

  // 2a. No third-party font stylesheet or preconnect in the startup page.
  assert.doesNotMatch(html,/fonts\.googleapis\.com|fonts\.gstatic\.com/,"index.html loads no font stylesheet from another site");
  const rev=html.match(/<meta name="app-asset-revision" content="([^"]+)">/)[1];
  assert.ok(html.includes(`<link rel="stylesheet" href="assets/fonts/barlow-condensed.css?v=${rev}">\n<link rel="stylesheet" id="appStyles"`),"local font sheet sits where the Google sheet was, before app.css");
  // 2b. The nine faces: 600/700/800 x vietnamese, latin-ext, latin, in Google's order, each file present and precached.
  const faces=[...fonts.matchAll(/\/\* (\S+) \*\/\n@font-face \{[^}]*font-family: 'Barlow Condensed';[^}]*font-weight: (\d+);[^}]*font-display: swap;[^}]*src: url\((barlow-condensed-[^)]+\.woff2)\) format\('woff2'\);[^}]*unicode-range: [^;]+;\n\}/g)];
  assert.deepEqual(faces.map(f=>`${f[1]}-${f[2]}`),["vietnamese-600","latin-ext-600","latin-600","vietnamese-700","latin-ext-700","latin-700","vietnamese-800","latin-ext-800","latin-800"]);
  const shell=[...sw.match(/const SHELL_PATHS = Object\.freeze\(\[([\s\S]*?)\]\);/)[1].matchAll(/"([^"]+)"/g)].map(m=>m[1]);
  const unversioned=[...sw.match(/const UNVERSIONED_SHELL_ASSET_PATHS = new Set\(\[([\s\S]*?)\]\);/)[1].matchAll(/"([^"]+)"/g)].map(m=>m[1]);
  assert.ok(shell.includes("assets/fonts/barlow-condensed.css"),"font sheet precached");
  for(const f of faces){
    const file=`assets/fonts/${f[3]}`,buf=fs.readFileSync(path.join(root,file));
    assert.equal(buf.subarray(0,4).toString("latin1"),"wOF2",`${file} is a WOFF2 file`);
    assert.ok(shell.includes(file),`${file} precached`);assert.ok(unversioned.includes(file),`${file} served from the shell without ?v=`);
  }
  // 2c. The sheet stands in for the external Google sheet, which the 37,500-byte startup budget never counted. It stays small:
  // nine @font-face rules and nothing else, so it cannot grow into a second startup stylesheet.
  const gz=require("node:zlib").gzipSync(Buffer.from(fonts),{level:9}).length;
  assert.ok(gz<=900,`font sheet gzip ${gz} <= 900`);
  assert.equal(fonts.replace(/\/\*[\s\S]*?\*\//g,"").replace(/@font-face \{[^}]*\}/g,"").trim(),"","the font sheet holds only @font-face rules");
  console.log("PASS r87 first load contracts: worker registers after the handover (bounded 20 s), Barlow Condensed served and precached locally");
})().catch(error=>{console.error(error);process.exit(1);});
