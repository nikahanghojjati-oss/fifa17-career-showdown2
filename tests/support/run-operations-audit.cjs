const fs=require('node:fs');const {spawnSync}=require('node:child_process');
const files=fs.readdirSync('tests/operations').filter(file=>file.startsWith('pos20-')&&file.endsWith('.test.mjs')).sort().map(file=>`tests/operations/${file}`);
if(!files.length)throw new Error('POS20 operations tests are required');
const result=spawnSync(process.execPath,['--test','--test-concurrency=1',...files],{stdio:'inherit',timeout:120000});
if(result.error)console.error(result.error.message);process.exitCode=result.status===0&&!result.error?0:1;
