function ensure(ok,msg){if(!ok)throw new Error(msg);}
export const operatingSystem='POS20';
export function requiredChecks(route){
  return ['POS20 exact selector','POS20 cognitive benchmark',...(route.operations?['POS20 operations authority']:[]),...(route.tests?.length?['POS20 selected deterministic census']:[]),...(route.proofGroups||[]).map(g=>`POS20 proof ${g}`),'POS20 exact-head cognitive seal'];
}
export function evaluateMerge(input,route){
  ensure(input&&input.action==='MERGE','Only MERGE is supported');
  const {candidateHead,expectedHead}=input;
  ensure(/^[a-f0-9]{40}$/.test(candidateHead),'Exact candidate SHA required');
  ensure(expectedHead===candidateHead,'expected_head protection required');
  ensure(input.continuityState==='READY','Continuity must be READY');
  ensure(input.candidateValidation==='GREEN','Candidate validation must be GREEN');
  ensure(Array.isArray(input.checkRuns),'Check evidence required');
  const checks=new Map();
  for(const check of input.checkRuns){ensure(check.head===candidateHead,'Mixed-head check evidence forbidden');ensure(!checks.has(check.name),'Duplicate check evidence forbidden');checks.set(check.name,check);}
  for(const name of requiredChecks(route)){const c=checks.get(name);ensure(c&&c.status==='completed'&&c.conclusion==='success',`Required exact-head check missing or red: ${name}`);}
  const reviews=input.reviews;ensure(reviews&&reviews.head===candidateHead,'Review evidence must match candidate head');ensure(reviews.changeRequests===0&&reviews.unresolvedThreads===0&&reviews.commentsReviewed===true,'Material review concerns block merge');
  return {operatingSystem,allowed:true,expected_head_sha:candidateHead,requiredChecks:requiredChecks(route)};
}

if(process.argv[1]&&process.argv[1].endsWith('pos20-publication.mjs')){
  const fs=await import('node:fs');
  try{if(process.argv.length!==3)throw new Error('Usage: pos20-publication.mjs EVIDENCE.json');const input=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));console.log(JSON.stringify(evaluateMerge(input.merge,input.route),null,2));}catch(e){console.error(e.message);process.exitCode=1;}
}
