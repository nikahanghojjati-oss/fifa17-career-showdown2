const wantsStdout=process.argv.includes('--stdout');
const originalArgv=process.argv;
const originalWrite=process.stdout.write;

if(wantsStdout){
  process.argv=process.argv.filter(argument=>argument!=='--stdout');
  process.stdout.write=function(){return true;};
}

try{
  await import('./build-production-firestore-rules.mjs');
}finally{
  process.argv=originalArgv;
  process.stdout.write=originalWrite;
}

const {injectPersistentPairRules}=await import('./inject-persistent-pair-rules.mjs');
const injected=injectPersistentPairRules();

// r88 Rules slimming: the last step of every build of the composed artifact moves the single-use validators into their
// match blocks so the Rules service compiles them inside its deadline (scripts/localize-firestore-rules-validators.mjs).
const {localizeArtifact}=await import('./localize-firestore-rules-validators.mjs');
const {text:generated,moved}=localizeArtifact();

if(wantsStdout)originalWrite.call(process.stdout,generated);
else originalWrite.call(process.stdout,`INJECTED persistent Nik/Daniel pair authority ${Buffer.byteLength(injected,'utf8')} bytes\nLOCALIZED ${moved.length} single-use Rules validators into their match blocks (${Buffer.byteLength(generated,'utf8')} bytes)\n`);
