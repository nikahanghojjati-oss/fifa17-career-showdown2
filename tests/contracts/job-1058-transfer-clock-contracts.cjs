const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const source=fs.readFileSync(path.resolve(__dirname,'../../js/productionSharedTransferChallenge.js'),'utf8');

// Execute only the production clock helpers: no browser setup or Firebase calls.
function helper(pattern,name){
  const match=source.match(pattern);
  assert.ok(match,`Transfer Challenge must define ${name}`);
  return match[0];
}
const helpers=[
  helper(/^  function pstcMonotonicNow\(\)[^\n]*$/m,'pstcMonotonicNow'),
  helper(/^  function pstcClockReady\(request\)[^\n]*$/m,'pstcClockReady'),
  helper(/^  function pstcAuthoritativeNow\(request=pstcRequestContext\(\)\)[^\n]*$/m,'pstcAuthoritativeNow'),
  helper(/^  async function pstcEnsureServerClock\(user,request\)\{[\s\S]*?^  \}/m,'pstcEnsureServerClock')
].join('\n');
const REQUEST=Object.freeze({key:'job-1058:season-1'});
const WHOLE_SECOND=Date.UTC(2026,9,9,12,0,0);

function clockHarness(issuedAtTime,delayMs=900){
  let performanceMs=1000;
  const sandbox={
    root:{performance:{now:()=>performanceMs}},
    pstcRequestMatches:request=>request?.key===REQUEST.key,
    pstcFail:(code,message)=>{const error=new Error(message||code);error.code=code;throw error;},
    Date
  };
  const api=vm.runInNewContext([
    'const CLOCK_REFRESH_MS=5*60*1000;',
    'let clockContextKey="",clockServerEpochMs=0,clockPerformanceMs=0,clockRefreshPerformanceMs=0;',
    helpers,
    '({ensure:pstcEnsureServerClock,authoritative:pstcAuthoritativeNow,snapshot:()=>({clockServerEpochMs,clockPerformanceMs,clockRefreshPerformanceMs})})'
  ].join('\n'),sandbox,{filename:'job-1058-production-clock-helpers.js'});
  const user={async getIdTokenResult(forceRefresh){
    assert.equal(forceRefresh,true,'the server clock must force a fresh token');
    performanceMs+=delayMs;
    return {issuedAtTime};
  }};
  return {api,user,setPerformanceMs:value=>{performanceMs=value;}};
}

(async()=>{
  // 900 ms fake network round trip: anchor to 1450, never receipt at 1900.
  const whole=clockHarness(new Date(WHOLE_SECOND).toUTCString());
  assert.equal(await whole.api.ensure(whole.user,REQUEST),true);
  assert.equal(whole.api.snapshot().clockPerformanceMs,1450,'use the request/receipt midpoint');
  assert.equal(whole.api.snapshot().clockRefreshPerformanceMs,1900,'refresh age starts on receipt');
  assert.equal(whole.api.snapshot().clockServerEpochMs,WHOLE_SECOND+500,'centre a whole-second UTC timestamp');

  whole.setPerformanceMs(2450);
  assert.equal(whole.api.authoritative(REQUEST),WHOLE_SECOND+1500,'authoritative time advances 1000 ms after the midpoint');

  // Millisecond-precise timestamps are already centred and must not gain 500 ms.
  const fractional=clockHarness('2026-10-09T12:00:00.250Z');
  assert.equal(await fractional.api.ensure(fractional.user,REQUEST),true);
  assert.equal(fractional.api.snapshot().clockPerformanceMs,1450);
  assert.equal(fractional.api.snapshot().clockServerEpochMs,WHOLE_SECOND+250,'preserve a millisecond-precise ISO timestamp');
  fractional.setPerformanceMs(2450);
  assert.equal(fractional.api.authoritative(REQUEST),WHOLE_SECOND+1250);

  console.log('PASS JOB-1058: midpoint transfer clock, whole-second centring, precise ISO timestamps and authoritative elapsed time.');
})().catch(error=>{console.error(error);process.exitCode=1;});
