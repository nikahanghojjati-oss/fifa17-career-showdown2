export const model="RB-1";
const text=v=>typeof v==="string"&&v.trim()?v.trim():"unknown";
export function buildRecoveryBeacon({repository,branch,pr,head,lane,blockerClass,lastSafeCheckpoint,nextAction,updatedAt=new Date().toISOString()}){
  return `<!-- POS4_RB1\n${JSON.stringify({model,updatedAt,repository:text(repository),branch:text(branch),pr:pr??"unknown",recordedHead:text(head),lane:text(lane),blockerClass:text(blockerClass),lastSafeCheckpoint:text(lastSafeCheckpoint),nextAction:text(nextAction),orientationOnly:true})}\nPOS4_RB1 -->`;
}
export function upsertRecoveryBeacon(body,beacon){
  const source=String(body||"");
  const pattern=/<!-- POS4_RB1\n[\s\S]*?\nPOS4_RB1 -->/;
  return pattern.test(source)?source.replace(pattern,beacon):`${source.trim()}\n\n${beacon}\n`;
}
