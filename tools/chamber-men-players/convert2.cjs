const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const [mode,id,tier,outDir]=process.argv.slice(2);
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-proxy-server','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:900,height:900}});p.on('console',m=>{const t=m.text();if(!/FBXLoader|clip /.test(t))console.log('console:',t)});p.on('pageerror',e=>{console.log('err:',e.message);process.exit(1);});
await p.goto(`http://localhost:8766/convert2.html?mode=${mode}&body=${id}&tier=${tier}`,{waitUntil:'commit'});await p.waitForFunction('window.done&&window.glb',null,{timeout:900000});
console.log(JSON.stringify(await p.evaluate('window.out')));fs.mkdirSync(outDir+'/uv',{recursive:true});
const name=mode==='anims'?`anims_${tier}.glb`:`body_${id.toLowerCase()}_${tier}.glb`;fs.writeFileSync(`${outDir}/${name}`,Buffer.from(await p.evaluate('window.glb'),'base64'));
if(mode!=='anims'){const uv=await p.evaluate('window.uv');for(const [k,v] of Object.entries(uv))fs.writeFileSync(`${outDir}/uv/uv_${id.toLowerCase()}_${k}.png`,Buffer.from(v.split(',')[1],'base64'));await p.screenshot({path:`${outDir}/preview_${id}_${tier}.png`});}
await b.close();})();
