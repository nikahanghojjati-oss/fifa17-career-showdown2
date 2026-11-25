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

// Who a red point goes to (r100 Phoenix owners, lead 2026-11-24). Anything not listed goes to the lead to route.
export const OWNERS=Object.freeze({
  fault:{swap:'B3 (fresh-device resume)',tapkill:'B3 (fresh-device resume)'},
  point:{'home-join':'B6 (JOIN survives offline)','unpair':'B6 (JOIN survives offline)','league-ball':'B2 (Ironman weak points)','chamber-kick':'B2 (Ironman weak points)','terminal-close':'B2 (Ironman weak points)'}
});
export function ownerOf({leg,point}){return OWNERS.fault[leg]||OWNERS.point[point]||'lead (route it)';}
// The red report: every failed point of every leg, grouped by owner, each with its one-command replay (from the leg record).
export function redReport({legs,t,sha='',runUrl=''}){
  const byOwner={};
  for(const l of Object.values(legs))if(l.verdict!=='PASS')for(const f of (l.failures?.length?l.failures:[{point:'?',phone:'-',checks:[l.verdict],replay:l.replay}])){
    const owner=ownerOf({leg:l.leg,point:f.point});(byOwner[owner]||(byOwner[owner]=[])).push(`- ${l.leg} ${l.verdict} at ${f.point} (${f.phone}): ${(f.checks||[]).join(', ')}. Replay: \`${f.replay}\``);
  }
  const lines=[`Ironman full matrix red on ${sha.slice(0,8)||'?'}${runUrl?` (${runUrl})`:''}.`,''];
  for(const [owner,items] of Object.entries(byOwner).sort())lines.push(`**${owner}**`,...items,'');
  if(t.missing.length)lines.push(`Missing reports: ${t.missing.join(', ')}`,'');
  if(t.bad.length)lines.push(`Reads rule red: ${t.bad.length} fault run(s); see the table artifact.`,'');
  lines.push('FLAKY legs count: passing on the rerun never closes a finding.');
  return lines.join('\n');
}

export function table({legs,reports,outDir=null,log=console.log}){
  const points=[...new Set(reports.flatMap(r=>(r.points||[]).map(p=>p.point)))];
  const results=reports.map(r=>({fault:r.fault,phone:r.phone,code:r.verdict==='PASS'?0:1,report:r}));
  const {matrix,bad}=buildMatrix({results,outDir:outDir||path.join(root,'test-results'),points,log,write:Boolean(outDir)});
  // Every leg left its record, and every journey leg its own report (the fault-free one is every comparison's baseline):
  // a leg record without its journey report proves nothing, so it counts as missing (Codex on #1574).
  const missing=LEGS.filter(leg=>!legs[leg]);
  for(const leg of LEGS.filter(leg=>leg!=='ce2pg'&&legs[leg]))if(!reports.some(r=>r.fault===leg&&Array.isArray(r.points)&&typeof r.verdict==='string'))missing.push(`${leg} (journey report)`);
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
  if(!t.ok&&opt('report')){fs.mkdirSync(path.dirname(path.resolve(opt('report'))),{recursive:true});fs.writeFileSync(opt('report'),`${redReport({legs,t,sha:process.env.GITHUB_SHA||'',runUrl:process.env.GITHUB_SERVER_URL&&process.env.GITHUB_RUN_ID?`${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`:''})}\n`);}
  else if(t.flaky.length&&opt('report')){fs.writeFileSync(opt('report'),`${redReport({legs,t:{...t,missing:[],bad:[]},sha:process.env.GITHUB_SHA||''}).replace('red on','FLAKY on')}\n`);}
  process.exitCode=t.ok?0:1;
}
