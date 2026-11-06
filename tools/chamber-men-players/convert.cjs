const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const [tier,outDir]=process.argv.slice(2);
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-proxy-server','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:900,height:900}});p.on('console',m=>{const t=m.text();if(!/FBXLoader: (Vertex|%s)/.test(t))console.log('console:',t)});p.on('pageerror',e=>console.log('err:',e.message));
await p.goto('http://localhost:8766/convert.html?tier='+tier,{waitUntil:'commit'});await p.waitForFunction('window.done',null,{timeout:600000});
const out=await p.evaluate('window.out');console.log(JSON.stringify(out));
fs.mkdirSync(outDir,{recursive:true});fs.writeFileSync(`${outDir}/player_${tier}.glb`,Buffer.from(await p.evaluate('window.glb'),'base64'));
const uv=await p.evaluate('window.uv');for(const [k,v] of Object.entries(uv))fs.writeFileSync(`${outDir}/uv_${k}.png`,Buffer.from(v.split(',')[1],'base64'));
await p.screenshot({path:`${outDir}/preview_${tier}.png`});await b.close();})();
