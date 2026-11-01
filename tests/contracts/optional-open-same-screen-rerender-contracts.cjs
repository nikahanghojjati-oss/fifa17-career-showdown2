const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.resolve(__dirname,'../../js/optionalModules.js'),'utf8');
const tick=()=>new Promise(r=>setTimeout(r,0));

async function run(scenario){
  let screen='careerStats',revision=1,opened=0;
  const button={attrs:{},classList:{toggle(c,on){button.busy=on;}},setAttribute(k,v){button.attrs[k]=v;}};
  const window={
    getActiveScreenName:()=>screen,getNavigationRevision:()=>revision,
    openTrophyRoom:()=>{opened++;},
    reportApplicationError:(c,e)=>{throw e;}
  };
  const document={getElementById:id=>id==='trophyRoomButton'?button:null,querySelector:()=>null,head:{appendChild(){}}};
  const context=vm.createContext({window,document,console,currentShowdown:{id:1}});
  vm.runInContext(source,context,{filename:'js/optionalModules.js'});
  let release;
  vm.runInContext('ensureTrophyRoomModule=()=>new Promise(r=>{globalThis.__release=r;});',context);
  const p=window.openOptionalModule('trophyRoom');
  await tick();
  assert.equal(button.busy,true,'trophy button shows busy while loading');
  scenario({bump:()=>{revision++;},leave:()=>{screen='mainMenu';revision++;},again:()=>window.openOptionalModule('trophyRoom')});
  context.__release();
  await p;
  await tick();
  return {opened,busy:button.busy};
}

(async()=>{
  const same=await run(h=>h.bump());
  assert.equal(same.opened,1,'same-screen re-render mid-load must still open the Trophy Room');
  assert.equal(same.busy,false);
  const away=await run(h=>h.leave());
  assert.equal(away.opened,0,'real navigation away must cancel the open');
  assert.equal(away.busy,false);
  console.log('optional-open-same-screen-rerender-contracts passed');
})().catch(e=>{console.error(e);process.exit(1);});
