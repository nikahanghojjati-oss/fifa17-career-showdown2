const wantsStdout=process.argv.includes('--stdout');
const originalArgv=process.argv;
const originalWrite=process.stdout.write;

if(wantsStdout){
  process.argv=process.argv.filter(argument=>argument!=='--stdout');
  process.stdout.write=function(){return true;};
}

try{
  await import('./build-production-firestore-rules-core.mjs');
}finally{
  process.argv=originalArgv;
  process.stdout.write=originalWrite;
}

const {injectPersistentPairRules}=await import('./inject-persistent-pair-rules.mjs');
const generated=injectPersistentPairRules();

if(wantsStdout){
  originalWrite.call(process.stdout,generated);
}else{
  originalWrite.call(process.stdout,`INJECTED persistent Nik/Daniel pair authority ${Buffer.byteLength(generated,'utf8')} bytes\n`);
}
