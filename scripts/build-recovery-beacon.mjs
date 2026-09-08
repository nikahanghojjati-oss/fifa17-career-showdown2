export const model="RB-2";
const text=v=>typeof v==="string"&&v.trim()?v.trim():"unknown";
const clean=v=>String(v??"").replace(/[\r\n]+/g," ").trim();

export function buildRecoveryBeacon({repository,branch,pr,head,lane,atomicWorkUnit,blockerClass,lastSafeCheckpoint,nextAction,validationSummary="unknown",updatedAt=new Date().toISOString()}){
  const payload={
    model,updatedAt,repository:text(repository),branch:text(branch),pr:pr??"unknown",recordedHead:text(head),
    lane:clean(lane)||"unknown",atomicWorkUnit:clean(atomicWorkUnit)||"unknown",blockerClass:text(blockerClass),
    lastSafeCheckpoint:clean(lastSafeCheckpoint)||"unknown",nextAction:clean(nextAction)||"unknown",
    validationSummary:clean(validationSummary)||"unknown",orientationOnly:true
  };
  return `<!-- POS5_RB2\n${JSON.stringify(payload)}\nPOS5_RB2 -->`;
}

export function upsertRecoveryBeacon(body,beacon){
  const source=String(body||"");
  const pattern=/<!-- POS5_RB2\n[\s\S]*?\nPOS5_RB2 -->/;
  return pattern.test(source)?source.replace(pattern,beacon):`${source.trim()}\n\n${beacon}\n`;
}
