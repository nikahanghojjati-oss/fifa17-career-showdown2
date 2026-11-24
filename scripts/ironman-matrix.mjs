// Ironman fault x point table (r100 Phoenix W10), for the Ironman full matrix workflow: every leg ran in its own job, so this
// reads each job's reports and builds the journey's own table and reads rule (tests/browser/support/fij-matrix.cjs: a fault run
// may cost at most 2.5 x the fault-free run with the same phone order, each point at most 3 x).
//   node scripts/ironman-matrix.mjs --dir <downloaded artifacts> [--out <dir>]
// Exit 1 when any leg failed twice, any fault run fails the reads rule, or a leg left no report. FLAKY legs are listed.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {LEGS} from './ironman-leg.mjs';

const require=createRequire(import.meta.url);
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const {buildMatrix}=require(path.join(root,'tests/browser/support/fij-matrix.cjs'));

// Every file under dir, skipping attempt-N folders (a failed first attempt's reports; the rerun's are the ones that count).
function walk(dir,out=[]){
  if(!fs.existsSync(dir))return out;
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(entry.isDirectory()){if(!/^attempt-\d+$/.test(entry.name))walk(path.join(dir,entry.name),out);}
    else out.push(path.join(dir,entry.name));
  }
  return out;
}
const readJson=file=>{try{return JSON.parse(fs.readFileSync(file,'utf8'));}catch{return null;}};

export function collect(dir){
  const files=walk(dir);
  const legs={};const reports=[];
  for(const file of files){
    const name=path.basename(file);
    if(/^ironman-[a-z0-9]+\.json$/.test(name)){const r=readJson(file);if(r?.schema==='ironman-leg/v1')legs[r.leg]=r;}
    else if(/^fij-[a-z]+-(?:alt|alt-nik|daniel|nik)\.json$/.test(name)){const r=readJson(file);if(r?.tool==='FIJ')reports.push(r);}
  }
  return {legs,reports};
}

export function table({legs,reports,outDir=null,log=console.log}){
  const points=[...new Set(reports.flatMap(r=>(r.points||[]).map(p=>p.point)))];
  const results=reports.map(r=>({fault:r.fault,phone:r.phone,code:r.verdict==='PASS'?0:1,report:r}));
  const {matrix,bad}=buildMatrix({results,outDir:outDir||path.join(root,'test-results'),points,log,write:Boolean(outDir)});
  const missing=LEGS.filter(leg=>!legs[leg]);
  const failed=Object.values(legs).filter(l=>l.verdict==='FAIL');
  const flaky=Object.values(legs).filter(l=>l.verdict==='FLAKY');
  return {matrix,bad,missing,failed,flaky,ok:!bad.length&&!missing.length&&!failed.length};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const argv=process.argv.slice(2);const opt=k=>{const i=argv.indexOf(`--${k}`);return i>=0?argv[i+1]:null;};
  const dir=opt('dir');if(!dir){console.error('usage: ironman-matrix.mjs --dir <reports> [--out <dir>]');process.exit(2);}
  const lines=[];const log=line=>{console.log(line);lines.push(line);};
  const {legs,reports}=collect(dir);
  const t=table({legs,reports,outDir:opt('out'),log});
  for(const leg of LEGS){const l=legs[leg];log(`- ${leg}: ${l?`${l.verdict} (seed ${l.seed}, ${l.seasons} seasons, ${l.attempts.length} attempt(s)); replay: ${l.replay}`:'NO REPORT'}`);}
  if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,`### Ironman full matrix: ${t.ok?'PASS':'FAIL'}\n\n${lines.join('\n')}\n`);
  for(const l of t.flaky)console.log(`::warning title=Ironman FLAKY ${l.leg}::passed only on the rerun (seed ${l.seed}). Replay: ${l.replay}`);
  if(!t.ok)console.log(`::error title=Ironman full matrix::${t.failed.map(l=>l.leg).join(', ')||'no leg'} failed twice; ${t.bad.length} fault run(s) red; missing: ${t.missing.join(', ')||'none'}`);
  process.exitCode=t.ok?0:1;
}
