const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname,'../..');
const workflowDirectory = path.join(root,'.github/workflows');

function extractLiteralRunBlocks(source){
  const lines = source.split(/\r?\n/);
  const blocks = [];
  for(let index=0; index<lines.length; index += 1){
    const marker = lines[index].match(/^(\s*)run:\s*\|\s*$/);
    if(!marker) continue;
    const markerIndent = marker[1].length;
    const collected = [];
    index += 1;
    while(index < lines.length){
      const line = lines[index];
      if(line.trim() && line.match(/^\s*/)[0].length <= markerIndent){
        index -= 1;
        break;
      }
      collected.push(line.length > markerIndent + 2 ? line.slice(markerIndent + 2) : '');
      index += 1;
    }
    blocks.push(collected.join('\n').trimEnd());
  }
  return blocks;
}

function localJavaMajor(){
  const result = spawnSync('java',['-version'],{encoding:'utf8'});
  const output = `${result.stdout || ''}\n${result.stderr || ''}`;
  const match = output.match(/version\s+"(?:1\.)?(\d+)/i);
  return match ? Number(match[1]) : null;
}

const args = process.argv.slice(2);
const requested = [];
for(let i=0;i<args.length;i++){
  if((args[i] === '--workflow' || args[i] === '--source') && args[i+1]) requested.push(args[++i]);
  else throw new Error(`Unknown argument: ${args[i]}`);
}

let workflowFiles;
if(requested.length){
  workflowFiles = requested.map(value=>{
    const candidate = value.includes('/') ? path.resolve(root,value) : path.join(workflowDirectory,value);
    assert.ok(fs.existsSync(candidate),`Requested workflow proof source does not exist: ${value}`);
    return candidate;
  });
}else{
  workflowFiles = fs.readdirSync(workflowDirectory)
    .filter(name=>name.endsWith('.yml') && !['validate-stability-lane.yml','deploy-github-pages.yml','prove-production-pages-rollback.yml'].includes(name))
    .map(name=>path.join(workflowDirectory,name))
    .sort();
}

const javaMajor = localJavaMajor();
let executed = 0;
let deferred = 0;
let discoveredBlocks = 0;
for(const workflowPath of workflowFiles){
  const display = path.relative(root,workflowPath).replace(/\\/g,'/');
  const source = fs.readFileSync(workflowPath,'utf8');
  const blocks = extractLiteralRunBlocks(source);
  discoveredBlocks += blocks.length;
  blocks.forEach((block,blockIndex)=>{
    if(display.endsWith('deploy-firestore-rules-zero-billing.yml')){
      process.stdout.write(`DEFER ${display} block ${blockIndex+1}/${blocks.length}: production provider deployment is CI-only.\n`);
      deferred += 1;
      return;
    }
    if(/firebase\s+emulators:exec/.test(block) && (!Number.isInteger(javaMajor) || javaMajor < 21)){
      process.stdout.write(`DEFER ${display} block ${blockIndex+1}/${blocks.length}: Firebase CLI requires Java 21; exact workflow CI owns this provider gate.\n`);
      deferred += 1;
      return;
    }
    process.stdout.write(`RUN   ${display} block ${blockIndex+1}/${blocks.length}\n`);
    const result = spawnSync('bash',['-lc',block],{cwd:root,env:process.env,encoding:'utf8',maxBuffer:32*1024*1024,timeout:30*60*1000});
    if(result.stdout) process.stdout.write(result.stdout);
    if(result.stderr) process.stderr.write(result.stderr);
    assert.equal(result.status,0,`${display} block ${blockIndex+1} failed.`);
    executed += 1;
  });
}
assert.ok(discoveredBlocks > 0,'No literal workflow proof blocks were discovered.');
process.stdout.write(`PASS workflow proof-source execution: ${executed} block(s) passed; ${deferred} provider-owned block(s) deferred.\n`);
