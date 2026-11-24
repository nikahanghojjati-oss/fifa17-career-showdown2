#!/usr/bin/env node
// Move POS20 registrations from the old shared list into one file per contract (tests/pos20-registry/<name>.json).
//
// Use it right after merging a gameplay branch that already has the registry split into a branch that still adds an entry to
// POS20_SUPPLEMENTAL_PRODUCT_TESTS.json (git then reports "modify/delete" on that file):
//
//   git merge origin/gameplay/r100        # conflicts on POS20_SUPPLEMENTAL_PRODUCT_TESTS.json (+ the control-plane list)
//   node scripts/pos20-registry-convert.mjs
//   node --test tests/operations/pos20-control-plane.test.mjs && git commit
//
// What it does:
//   1. Reads the old list left in the working tree. During a merge it converts only the entries the list's side added or
//      changed since the merge base (the other side's registry files stay authoritative for everything else); with no merge
//      in progress it converts every entry that has no registry file yet.
//   2. Writes tests/pos20-registry/<name>.json for each, with the list's own route pattern replaced by the file's own path.
//   3. Removes POS20_SUPPLEMENTAL_PRODUCT_TESTS.json (git rm) and, if tests/operations/pos20-control-plane.test.mjs has a
//      conflict between the old expectedSupplementalContracts line and the new coreSupplementalContracts line, keeps the
//      core line (a registry file is all a new contract needs). Any other conflict is left for you and reported.
// Flags: --dry-run (print only).
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const LIST='POS20_SUPPLEMENTAL_PRODUCT_TESTS.json',DIR='tests/pos20-registry',CONTROL='tests/operations/pos20-control-plane.test.mjs';
const dryRun=process.argv.includes('--dry-run');
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']});
const tryGit=(...args)=>{try{return git(...args);}catch(_error){return null;}};
const escape=text=>text.replace(/[.*+?^${}()|[\]\\-]/g,'\\$&');
const listPattern=`^${escape(LIST)}$`;
const key=entry=>JSON.stringify([entry.path,entry.patterns]);
const parseList=text=>{const value=JSON.parse(text);if(!value||!Array.isArray(value.tests))throw new Error(`${LIST} has no "tests" array.`);return value.tests;};

const listFile=path.join(root,LIST);
const notes=[];
if(!fs.existsSync(listFile)){
  console.log(`${LIST} is not in the working tree: nothing to convert.`);
}else{
  const current=parseList(fs.readFileSync(listFile,'utf8'));
  let since=null;
  if(tryGit('rev-parse','-q','--verify','MERGE_HEAD')){
    const base=tryGit('merge-base','HEAD','MERGE_HEAD');
    const atBase=base&&tryGit('show',`${base.trim()}:${LIST}`);
    if(atBase){since=new Set(parseList(atBase).map(key));notes.push(`merge in progress: converting what the list's side added or changed since ${base.trim().slice(0,9)}`);}
  }
  let written=0,kept=0,unchanged=0;
  for(const entry of current){
    const name=path.basename(entry.path,'.cjs');
    if(!/^tests\/contracts\/[A-Za-z0-9._-]+\.cjs$/.test(entry.path)){notes.push(`skipped an invalid path: ${entry.path}`);continue;}
    const file=path.join(root,DIR,`${name}.json`);
    if(since&&since.has(key(entry))){unchanged+=1;continue;}
    const patterns=entry.patterns.map(pattern=>pattern===listPattern?`^${DIR}/${escape(name)}\\.json$`:pattern);
    if(!patterns.includes(`^${DIR}/${escape(name)}\\.json$`))patterns.push(`^${DIR}/${escape(name)}\\.json$`);
    const body=`${JSON.stringify({path:entry.path,patterns},null,2)}\n`;
    if(fs.existsSync(file)){
      if(fs.readFileSync(file,'utf8')===body){kept+=1;continue;}
      if(!since){notes.push(`kept the existing ${DIR}/${name}.json (it differs from the old list; check it by hand)`);kept+=1;continue;}
      notes.push(`updated ${DIR}/${name}.json from the list's side`);
    }
    console.log(`${dryRun?'would write':'write'} ${DIR}/${name}.json`);
    if(!dryRun)fs.writeFileSync(file,body);
    written+=1;
  }
  console.log(`${written} registry file(s) written, ${kept} already present${since?`, ${unchanged} unchanged since the merge base`:''}.`);
  if(!dryRun){tryGit('rm','-q','--cached','--ignore-unmatch',LIST);fs.rmSync(listFile,{force:true});console.log(`removed ${LIST}`);}
}

// The control plane's old expected list: keep the new core line when that is the only thing in conflict.
const controlFile=path.join(root,CONTROL);
if(fs.existsSync(controlFile)){
  const text=fs.readFileSync(controlFile,'utf8');
  if(text.includes('<<<<<<< ')){
    let left=0;
    const resolved=text.replace(/^<<<<<<< [^\n]*\n([\s\S]*?)^=======\n([\s\S]*?)^>>>>>>> [^\n]*\n/gm,(block,a,b)=>{
      const core=[a,b].find(side=>/const coreSupplementalContracts=/.test(side)),old=[a,b].find(side=>/const expectedSupplementalContracts=/.test(side)&&!/coreSupplementalContracts/.test(side));
      if(core&&old&&core!==old)return core;
      left+=1;return block;
    });
    if(resolved!==text){
      if(!dryRun){fs.writeFileSync(controlFile,resolved);if(!left)git('add',CONTROL);}
      console.log(`${CONTROL}: kept coreSupplementalContracts${left?`; ${left} other conflict(s) left for you`:''}`);
    }else console.log(`${CONTROL}: has conflicts this tool does not resolve (${left}); fix them by hand`);
  }
}
if(!dryRun&&fs.existsSync(path.join(root,DIR))&&tryGit('add',DIR)===null)notes.push(`git add ${DIR} failed: add the new files yourself`);
for(const note of notes)console.log(`note: ${note}`);
console.log('next: node --test tests/operations/pos20-control-plane.test.mjs');
