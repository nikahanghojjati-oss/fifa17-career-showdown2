import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const model="RACE-6";
const norm=v=>String(v||"").replace(/\\/g,"/").replace(/^\.\//,"");
const any=(files,patterns)=>files.some(file=>patterns.some(pattern=>pattern.test(file)));

const groups={
  operations:[/^AGENTS\.md$/, /^NEXT_TASK\.md$/, /^PROJECT_OPERATING_SYSTEM_V6(?:\.|_)/, /^POS6_(?:CONTINUITY_MODEL|RISK_MAP)\.json$/, /^scripts\/pos6-/, /^tests\/contracts\/(?:project-operating-system-v6|pos6-)/, /^tests\/support\/run-operations-audit\.cjs$/],
  docs:[/\.md$/],
  release:[/^\.github\/workflows\//,/^package(?:-lock)?\.json$/,/^service-worker\.js$/,/^manifest\.webmanifest$/,/^CURRENT_PRODUCT_GUARDS\.json$/,/^CURRENT_PRODUCT_TEST_MANIFEST\.json$/,/^scripts\/verify-deployment\.mjs$/,/^scripts\/pos6-risk-router\.mjs$/],
  remote:[/^firestore(?:\.|-)/,/^firebase(?:\.|-)/,/^\.firebaserc$/,/^js\/(?:firebase|connected|stage[345]|sharedShowdown|pairing|remote)/i,/^scripts\/build-production-firestore-rules\.mjs$/,/^tests\/(?:firebase|browser|contracts)\/(?:stage[345]|pairing|shared-showdown|cloud|remote-data|spark|production-app-check|firebase-permanent)/i],
  storage:[/^js\/(?:storage|backup|import|restore|save)/i,/^tests\/(?:browser|contracts)\/(?:backup|import|restore|save-library|multi-save)/i],
  visual:[/^assets\//,/^css\//,/^data\//,/^tests\/browser\/(?:home-visual|loading-visual|football-visual|shared-showdown-polished-presentation)/,/^tests\/contracts\/(?:licensed-football-visuals|final-polish|shared-showdown-polished-presentation)/],
  runtime:[/^index\.html$/,/^js\//,/^tests\/browser\//,/^tests\/contracts\//]
};

const fullRun=operations=>({deterministic:true,operations,browser:"FULL",remoteEmulator:true,storageBrowser:true,visualBrowser:true,staticSpark:true});

export function routeFiles(input){
  const files=[...new Set((input||[]).map(norm).filter(Boolean))];
  if(!files.length)return {model,profile:"FULL_SEAL",files,reason:"No changed-file evidence; fail closed.",run:fullRun(true)};
  const nonDocs=files.filter(f=>!groups.docs.some(p=>p.test(f)));
  const opsOnly=nonDocs.length>0&&nonDocs.every(f=>groups.operations.some(p=>p.test(f)));
  const docOnly=nonDocs.length===0;
  if(docOnly)return {model,profile:"DOC_ONLY",files,reason:"Documentation-only change.",run:{deterministic:false,operations:false,browser:"NONE",remoteEmulator:false,storageBrowser:false,visualBrowser:false,staticSpark:false}};
  if(opsOnly)return {model,profile:"OPS_ONLY",files,reason:"Operating-system-only change.",run:{deterministic:false,operations:true,browser:"NONE",remoteEmulator:false,storageBrowser:false,visualBrowser:false,staticSpark:false}};
  const release=any(files,groups.release),remote=any(files,groups.remote),storage=any(files,groups.storage),visual=any(files,groups.visual),runtime=any(files,groups.runtime);
  const domains=[remote,storage,visual].filter(Boolean).length;
  if(release||domains>=3)return {model,profile:"FULL_SEAL",files,reason:release?"Release/workflow/core authority changed.":"Three or more product risk domains changed.",run:fullRun(true)};
  if(remote&&storage)return {model,profile:"REMOTE_STORAGE",files,reason:"Remote and storage authority changed.",run:{deterministic:true,operations:any(files,groups.operations),browser:"REMOTE",remoteEmulator:true,storageBrowser:true,visualBrowser:false,staticSpark:true}};
  if(remote)return {model,profile:"REMOTE",files,reason:"Remote/pairing/session/provider authority changed.",run:{deterministic:true,operations:any(files,groups.operations),browser:"REMOTE",remoteEmulator:true,storageBrowser:false,visualBrowser:false,staticSpark:true}};
  if(storage)return {model,profile:"STORAGE",files,reason:"Save/import/restore authority changed.",run:{deterministic:true,operations:any(files,groups.operations),browser:"STORAGE",remoteEmulator:false,storageBrowser:true,visualBrowser:false,staticSpark:false}};
  if(visual&&!runtime)return {model,profile:"VISUAL",files,reason:"Visual-only product surface changed.",run:{deterministic:true,operations:any(files,groups.operations),browser:"VISUAL",remoteEmulator:false,storageBrowser:false,visualBrowser:true,staticSpark:false}};
  if(visual)return {model,profile:"VISUAL_RUNTIME",files,reason:"Visual plus runtime surface changed.",run:{deterministic:true,operations:any(files,groups.operations),browser:"VISUAL",remoteEmulator:false,storageBrowser:false,visualBrowser:true,staticSpark:false}};
  if(runtime)return {model,profile:"GENERAL_RUNTIME",files,reason:"General executable runtime changed.",run:{deterministic:true,operations:any(files,groups.operations),browser:"FULL",remoteEmulator:false,storageBrowser:false,visualBrowser:false,staticSpark:false}};
  return {model,profile:"FULL_SEAL",files,reason:"Unclassified non-document change; fail closed.",run:fullRun(true)};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const args=process.argv.slice(2); let files=[]; let json=false; let githubOutput=null;
    for(let i=0;i<args.length;i++){
      if(args[i]==="--files"&&args[i+1])files.push(...args[++i].split(","));
      else if(args[i]==="--files-file"&&args[i+1])files.push(...fs.readFileSync(path.resolve(args[++i]),"utf8").split(/\r?\n/));
      else if(args[i]==="--json")json=true;
      else if(args[i]==="--github-output"&&args[i+1])githubOutput=args[++i];
      else throw new Error(`Unknown argument: ${args[i]}`);
    }
    const result=routeFiles(files);
    if(githubOutput){
      const lines=[`profile=${result.profile}`,`run_deterministic=${result.run.deterministic}`,`run_operations=${result.run.operations}`,`browser=${result.run.browser}`,`run_remote_emulator=${result.run.remoteEmulator}`,`run_storage_browser=${result.run.storageBrowser}`,`run_visual_browser=${result.run.visualBrowser}`,`run_static_spark=${result.run.staticSpark}`];
      fs.appendFileSync(path.resolve(githubOutput),`${lines.join("\n")}\n`);
    }
    if(json||!githubOutput)process.stdout.write(`${JSON.stringify(result,null,2)}\n`);
  }catch(e){process.stderr.write(`${e.message}\n`);process.exitCode=1;}
}
