const {spawnSync}=require("node:child_process");
const files=[
  "tests/contracts/project-operating-system-v6-contracts.cjs",
  "tests/contracts/pos6-continuity-contracts.cjs",
  "tests/contracts/pos6-risk-router-contracts.cjs",
  "tests/contracts/pos6-product-gate-purity-contracts.cjs"
];
const failures=[];
for(const file of files){
  const result=spawnSync(process.execPath,[file],{encoding:"utf8",timeout:60000,maxBuffer:4*1024*1024});
  if(result.stdout)process.stdout.write(result.stdout);
  if(result.stderr)process.stderr.write(result.stderr);
  if(result.status!==0||result.error)failures.push({file,error:result.error?.message||null});
}
if(failures.length){
  console.error(`POS6 operations census failed in ${failures.length} file(s):`);
  for(const f of failures)console.error(`- ${f.file}${f.error?` error=${f.error}`:""}`);
  process.exitCode=1;
}else console.log(`PASS POS6 operations audit (${files.length} files)`);
