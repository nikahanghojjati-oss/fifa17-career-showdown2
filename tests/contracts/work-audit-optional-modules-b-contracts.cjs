const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const nodes=[],unhandled=[],reported=[],opened=[];
const button={busy:false,setAttribute(name,value){if(name==='aria-busy')this.busy=value==='true';},classList:{toggle(){}}};
const context={console,document:{
  querySelector(){return null;},getElementById(){return button;},
  head:{appendChild(node){nodes.push(node);}},
  createElement(tag){
    const listeners=new Map();
    return {tag,dataset:{},addEventListener(type,fn){listeners.set(type,fn);},
      removeEventListener(type){listeners.delete(type);},remove(){this.removed=true;},
      emit(type){listeners.get(type)?.();}};
  }
},setTimeout(){return 1;},clearTimeout(){},
getActiveScreenName(){return 'mainMenu';},getNavigationRevision(){return 1;},
reportApplicationError(name,error){reported.push(error.message);}};
context.window=context;
vm.createContext(context);
vm.runInContext(fs.readFileSync('js/optionalModules.js','utf8'),context,{filename:'js/optionalModules.js'});
// The required presentation is already prepared; use real optional style/script loaders.
vm.runInContext('ensureRequiredFootballVisualExperience = async () => true;',context);
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const capture=error=>unhandled.push(error.message);
const handled=()=>{};
process.on('unhandledRejection',capture);
process.on('rejectionHandled',handled);
(async()=>{
  try{
    let result='pending';
    const first=context.openOptionalModule('careerStatistics').then(value=>result=value);
    nodes.find(node=>node.tag==='link').emit('error');
    await tick();
    assert.equal(unhandled.length,0,'a fast stylesheet failure must be caught while analytics script is pending');
    assert.equal(result,false,'the failed open must settle without waiting for the slow analytics script');
    assert.equal(context.getOptionalModuleState().careerStatistics,'error');
    assert.equal(button.busy,false,'the player can retry after the failed dependency settles');
    assert.deepEqual(reported,['Unable to load css/analytics.css.']);
    assert.deepEqual(opened,[]);
    await first;

    const retry=context.openOptionalModule('careerStatistics');
    const styles=nodes.filter(node=>node.tag==='link');
    assert.equal(styles.length,2,'retry requests the failed stylesheet again');
    styles[1].emit('load');
    context.buildRivalryAnalytics=context.buildCareerAnalytics=()=>{};
    nodes.find(node=>node.dataset.runtimeScript==='analytics-engine').emit('load');
    await tick();
    context.openCareerStatistics=()=>opened.push('careerStatistics');
    context.openRivalryStatistics=()=>opened.push('statistics');
    context.createAnalyticsStat=()=>{};
    nodes.find(node=>node.dataset.runtimeScript==='statistics-ui').emit('load');
    assert.equal(await retry,true);
    assert.equal(context.getOptionalModuleState().careerStatistics,'ready');
    assert.equal(button.busy,false);
    assert.deepEqual(opened,['careerStatistics'],'retry opens the requested screen exactly once');
    assert.equal(nodes.filter(node=>node.dataset.runtimeScript==='analytics-engine').length,1,'retry reuses the pending script');
    assert.equal(nodes.filter(node=>node.dataset.runtimeScript==='statistics-ui').length,1);
    const count=nodes.length;
    assert.equal(await context.openOptionalModule('careerStatistics'),true);
    assert.equal(nodes.length,count,'a ready screen does not reload its assets');
    assert.equal(unhandled.length,0);
    console.log('PASS optional Statistics fast stylesheet failure is handled immediately; retry reuses scripts and opens the correct screen.');
  }finally{
    process.removeListener('unhandledRejection',capture);
    process.removeListener('rejectionHandled',handled);
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
