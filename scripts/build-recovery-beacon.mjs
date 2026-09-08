import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const model="RB-2";
export const maxBytes=4096;
const text=v=>typeof v==="string"&&v.trim()?v.trim():"unknown";
const clean=v=>String(v??"").replace(/[\r\n]+/g," ").trim();

export function buildRecoveryBeacon({repository,branch,pr,head,lane,atomicWorkUnit,blockerClass,lastSafeCheckpoint,nextAction,validationSummary="unknown",updatedAt=new Date().toISOString()}){
  const payload={
    model,updatedAt,repository:text(repository),branch:text(branch),pr:pr??"unknown",recordedHead:text(head),
    lane:clean(lane)||"unknown",atomicWorkUnit:clean(atomicWorkUnit)||"unknown",blockerClass:text(blockerClass),
    lastSafeCheckpoint:clean(lastSafeCheckpoint)||"unknown",nextAction:clean(nextAction)||"unknown",
    validationSummary:clean(validationSummary)||"unknown",orientationOnly:true
  };
  const beacon=`<!-- POS5_RB2\n${JSON.stringify(payload)}\nPOS5_RB2 -->`;
  if(Buffer.byteLength(beacon,"utf8")>maxBytes)throw new Error(`RB-2 exceeds ${maxBytes} byte cap.`);
  return beacon;
}

export function upsertRecoveryBeacon(body,beacon){
  const source=String(body||"");
  const pattern=/<!-- POS5_RB2\n[\s\S]*?\nPOS5_RB2 -->/;
  return pattern.test(source)?source.replace(pattern,beacon):`${source.trim()}\n\n${beacon}\n`;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const args=process.argv.slice(2);
    const inputPath=args.shift();
    if(!inputPath)throw new Error("Usage: node scripts/build-recovery-beacon.mjs <beacon-input.json> [--body current-pr-body.md] [--out output.md]");
    let bodyPath=null,outputPath=null;
    for(let i=0;i<args.length;i++){
      if(args[i]==="--body"&&args[i+1])bodyPath=args[++i];
      else if(args[i]==="--out"&&args[i+1])outputPath=args[++i];
      else throw new Error(`Unknown or incomplete argument: ${args[i]}`);
    }
    const input=JSON.parse(fs.readFileSync(path.resolve(inputPath),"utf8"));
    const beacon=buildRecoveryBeacon(input);
    const output=bodyPath?upsertRecoveryBeacon(fs.readFileSync(path.resolve(bodyPath),"utf8"),beacon):beacon;
    if(outputPath){
      const resolved=path.resolve(outputPath);
      fs.writeFileSync(resolved,output);
      process.stdout.write(`${resolved}\n`);
    }else process.stdout.write(`${output}\n`);
  }catch(e){process.stderr.write(`${e.message}\n`);process.exitCode=1;}
}
