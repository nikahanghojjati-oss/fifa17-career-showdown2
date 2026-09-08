const fs=require('node:fs');const {spawnSync}=require('node:child_process');
const files=fs.readdirSync('tests/operations').filter(file=>/^pos(?:10|20)-.*\.test\.mjs$/.test(file)).sort().map(file=>`tests/operations/${file}`);
if(!files.some(file=>file.includes('/pos10-')))throw new Error('Inherited POS10 operations tests are required');
if(!files.some(file=>file.includes('/pos20-')))throw new Error('POS20 operations tests are required');
const result=spawnSync(process.execPath,['--test','--test-concurrency=1',...files],{stdio:'inherit',timeout:180000});
if(result.error)console.error(result.error.message);process.exitCode=result.status===0&&!result.error?0:1;
