const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.resolve(__dirname,'../../js/optionalModules.js'),'utf8');
const tick=()=>new Promise(setImmediate);

async function checkFailure(kind){
  const nodes=[],timers=new Map(),reported=[],opened=[];
  let nextTimer=0;
  const window={
    setTimeout(fn){const id=++nextTimer;timers.set(id,fn);return id;},
    clearTimeout:id=>timers.delete(id),
    getActiveScreenName:()=> 'mainMenu',getNavigationRevision:()=>0,
    reportApplicationError:(context,error)=>reported.push([context,error.message])
  };
  const document={
    getElementById:()=>null,
    querySelector(selector){return nodes.find(n=>!n.removed&&selector===`link[data-optional-style="${n.dataset.optionalStyle}"]`)||null;},
    head:{appendChild:node=>nodes.push(node)},
    createElement(tag){
      const handlers=new Map();
      return {tag,dataset:{},sheet:null,removed:false,
        addEventListener:(type,fn)=>handlers.set(type,fn),
        removeEventListener:type=>handlers.delete(type),
        remove(){this.removed=true;},fire(type){handlers.get(type)?.();}};
    }
  };
  const context=vm.createContext({window,document,console,currentShowdown:{id:1}});
  vm.runInContext(source,context,{filename:'js/optionalModules.js'});
  // Football presentation is already ready; exercise the real Statistics loader and opener.
  vm.runInContext('ensureRequiredFootballVisualExperience=async()=>true;',context);
  const unhandled=[];
  const onUnhandled=error=>unhandled.push(error.message);
  process.on('unhandledRejection',onUnhandled);
  try{
    const first=window.openOptionalModule('careerStatistics');
    const style=nodes.find(n=>n.tag==='link');
    if(kind==='error')style.fire('error');
    else timers.get(1)();
    await tick();
    console.log(`${kind}: unhandled stylesheet rejections before script completes = ${unhandled.length}`);
    assert.equal(unhandled.length,0,'early stylesheet failure must stay handled while the script loads');
    window.buildRivalryAnalytics=()=>{};window.buildCareerAnalytics=()=>{};
    nodes.find(n=>n.dataset.runtimeScript==='analytics-engine').fire('load');
    await tick();
    window.openCareerStatistics=()=>opened.push('careerStatistics');
    window.openRivalryStatistics=()=>opened.push('statistics');window.createAnalyticsStat=()=>{};
    nodes.find(n=>n.dataset.runtimeScript==='statistics-ui').fire('load');
    assert.equal(await first,false);
    assert.equal(reported.length,1,'normal module failure still reaches its caller');
    assert.equal(window.getOptionalModuleState().careerStatistics,'error');
    assert.equal(style.removed,true);
    const retry=window.openOptionalModule('careerStatistics');
    const retryStyle=nodes.filter(n=>n.tag==='link').at(-1);
    assert.notEqual(retryStyle,style,'failed CSS must be requested again');
    retryStyle.sheet={};retryStyle.fire('load');
    assert.equal(await retry,true);
    assert.deepEqual(opened,['careerStatistics']);
    assert.equal(await window.openOptionalModule('careerStatistics'),true);
    assert.equal(await window.openOptionalModule('statistics'),true);
    assert.deepEqual(opened,['careerStatistics','careerStatistics','statistics']);
    assert.equal(nodes.filter(n=>n.tag==='script').length,2,'loaded scripts must be reused on retry and reopen');
    assert.equal(nodes.filter(n=>n.tag==='link').length,2,'successful CSS must be reused');
    await tick();assert.equal(unhandled.length,0);
  }finally{process.removeListener('unhandledRejection',onUnhandled);}
}
(async()=>{
  await checkFailure('error');await checkFailure('timeout');
  console.log('PASS optional stylesheet failures stay handled; retries open the right Statistics screen and reuse loaded assets.');
})().catch(error=>{console.error(error);process.exitCode=1;});
