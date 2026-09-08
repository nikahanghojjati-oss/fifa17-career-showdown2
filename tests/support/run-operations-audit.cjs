const {spawnSync}=require('node:child_process');
const files=[
  'tests/contracts/project-operating-system-v8-contracts.cjs',
  'tests/contracts/pos8-crash-shield-contracts.cjs',
  'tests/contracts/pos7-impact-router-contracts.cjs',
  'tests/contracts/pos7-product-gate-purity-contracts.cjs'
];
const failures=[];
for(const file of files){
  const result=spawnSync(process.execPath,[file],{encoding:'utf8',timeout:120000,maxBuffer:8*1024*1024});
  if(result.stdout)process.stdout.write(result.stdout);
  if(result.stderr)process.stderr.write(result.stderr);
  if(result.status!==0||result.error)failures.push({file,error:result.error?.message||`exit ${result.status}`});
}
if(failures.length){
  console.error(`POS8 operations census failed in ${failures.length} file(s):`);
  for(const failure of failures)console.error(`- ${failure.file}: ${failure.error}`);
  process.exitCode=1;
}else console.log(`PASS POS8 operations audit (${files.length} files)`);
