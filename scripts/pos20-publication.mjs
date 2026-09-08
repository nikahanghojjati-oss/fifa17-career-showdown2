import {execFileSync} from 'node:child_process';
import {routeFiles} from './pos20-impact-router.mjs';

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
  ensure(!input.routeProfile||input.routeProfile===route.profile,'Live route changed during publication preflight');
  return {operatingSystem,allowed:true,expected_head_sha:candidateHead,requiredChecks:requiredChecks(route),routeProfile:route.profile};
}

const gh=(...args)=>execFileSync('gh',args,{encoding:'utf8',stdio:['ignore','pipe','pipe'],maxBuffer:16*1024*1024}).trim();
function parseJson(text,label){try{return JSON.parse(text);}catch{throw new Error(`Invalid GitHub response for ${label}`);}}
function defaultRest(endpoint){return parseJson(gh('api',endpoint,'-H','Accept: application/vnd.github+json'),endpoint);}
function defaultGraphql(query,variables){const args=['api','graphql','-f',`query=${query}`];for(const [key,value] of Object.entries(variables))args.push('-F',`${key}=${value}`);return parseJson(gh(...args),'graphql');}
export const liveGitHubClient=Object.freeze({rest:defaultRest,graphql:defaultGraphql});
function splitRepo(repository){ensure(/^[^/\s]+\/[^/\s]+$/.test(repository||''),'repository must be owner/name');return repository.split('/');}
function exactSha(value,label){ensure(/^[a-f0-9]{40}$/.test(value||''),`${label} must be an exact commit SHA`);return value;}
function refEndpoint(repository,ref){return `repos/${repository}/git/ref/heads/${encodeURIComponent(ref)}`;}
function refSha(client,repository,ref){const data=client.rest(refEndpoint(repository,ref));return exactSha(data?.object?.sha,`live ${ref}`);}
function boundedArray(value,label){ensure(Array.isArray(value),`${label} must be an array`);ensure(value.length<100,`${label} reached pagination boundary; refuse incomplete evidence`);return value;}
function latestReviewStates(reviews){const latest=new Map();for(const review of reviews){const who=review?.user?.login||review?.author?.login||String(review?.id||'unknown');const when=Date.parse(review?.submitted_at||review?.submittedAt||review?.created_at||0)||0;const prior=latest.get(who);if(!prior||when>=prior.when)latest.set(who,{when,state:String(review?.state||'').toUpperCase()});}return [...latest.values()];}
function newestTime(items){return items.reduce((max,item)=>Math.max(max,Date.parse(item?.updated_at||item?.created_at||0)||0),0);}
const THREAD_QUERY=`query($owner:String!,$name:String!,$number:Int!){repository(owner:$owner,name:$name){pullRequest(number:$number){reviewThreads(first:100){nodes{isResolved comments(first:100){nodes{createdAt updatedAt author{login}} pageInfo{hasNextPage}}} pageInfo{hasNextPage}}}}}`;

export function resolveLivePublication(config,client=liveGitHubClient){
  ensure(config&&config.action==='MERGE','Only MERGE is supported');
  const repository=config.repository;const [owner,name]=splitRepo(repository);const prNumber=Number(config.prNumber||config.pr);
  ensure(Number.isInteger(prNumber)&&prNumber>0,'prNumber must be a positive integer');
  ensure(typeof config.recoveryRef==='string'&&config.recoveryRef,'recoveryRef is required');
  const pr=client.rest(`repos/${repository}/pulls/${prNumber}`);
  ensure(pr&&pr.state==='open','Pull request must be open');
  const baseRef=pr.base?.ref;const candidateRef=pr.head?.ref;ensure(baseRef&&candidateRef,'Live pull request refs are required');
  if(config.candidateRef)ensure(config.candidateRef===candidateRef,'Candidate ref changed during publication preflight');
  const mainHead=refSha(client,repository,baseRef);const candidateHead=refSha(client,repository,candidateRef);const recoveryHead=refSha(client,repository,config.recoveryRef);
  exactSha(pr.head?.sha,'live PR head');ensure(pr.head.sha===candidateHead,'Pull request head and candidate ref disagree');
  if(config.expectedHead)ensure(config.expectedHead===candidateHead,'expected_head is stale against live candidate');
  ensure(recoveryHead===candidateHead,'Recovery branch must contain the exact candidate');
  const comparison=client.rest(`repos/${repository}/compare/${mainHead}...${candidateHead}`);
  ensure(comparison?.merge_base_commit?.sha===mainHead,'Candidate does not descend from current main');
  ensure(['ahead','identical'].includes(comparison?.status),'Candidate ancestry is not publication-safe');
  const fileRows=boundedArray(client.rest(`repos/${repository}/pulls/${prNumber}/files?per_page=100`),'changed files');
  const changedFiles=fileRows.map(row=>row.filename).filter(Boolean);ensure(changedFiles.length>0,'Live pull request has no changed files');
  const route=routeFiles(changedFiles,config.routeContext||{});
  const checkPayload=client.rest(`repos/${repository}/commits/${candidateHead}/check-runs?per_page=100`);ensure(Number(checkPayload?.total_count||0)<100,'check runs reached pagination boundary; refuse incomplete evidence');
  const checkRows=Array.isArray(checkPayload?.check_runs)?checkPayload.check_runs:[];
  const checkRuns=checkRows.map(run=>({name:run.name,head:run.head_sha,status:run.status,conclusion:run.conclusion}));
  const reviewRows=boundedArray(client.rest(`repos/${repository}/pulls/${prNumber}/reviews?per_page=100`),'reviews');
  const issueComments=boundedArray(client.rest(`repos/${repository}/issues/${prNumber}/comments?per_page=100`),'issue comments');
  const reviewComments=boundedArray(client.rest(`repos/${repository}/pulls/${prNumber}/comments?per_page=100`),'review comments');
  const threadPayload=client.graphql(THREAD_QUERY,{owner,name,number:prNumber});const threads=threadPayload?.data?.repository?.pullRequest?.reviewThreads;
  ensure(threads&&!threads.pageInfo?.hasNextPage,'review threads reached pagination boundary; refuse incomplete evidence');
  for(const thread of threads.nodes||[])ensure(!thread?.comments?.pageInfo?.hasNextPage,'review thread comments reached pagination boundary; refuse incomplete evidence');
  const unresolvedThreads=(threads.nodes||[]).filter(thread=>thread?.isResolved!==true).length;
  const reviewStates=latestReviewStates(reviewRows);const changeRequests=reviewStates.filter(review=>review.state==='CHANGES_REQUESTED').length;
  const latestReviewAt=reviewRows.reduce((max,review)=>Math.max(max,Date.parse(review?.submitted_at||review?.submittedAt||0)||0),0);
  const newestConversation=Math.max(newestTime(issueComments),newestTime(reviewComments));
  const commentsReviewed=newestConversation===0||latestReviewAt>=newestConversation;
  const merge={action:'MERGE',candidateHead,expectedHead:candidateHead,continuityState:config.continuityState,candidateValidation:config.candidateValidation,routeProfile:route.profile,checkRuns,reviews:{head:candidateHead,changeRequests,unresolvedThreads,commentsReviewed}};
  const decision=evaluateMerge(merge,route);
  return {...decision,live:{repository,prNumber,baseRef,candidateRef,recoveryRef:config.recoveryRef,mainHead,candidateHead,recoveryHead,changedFiles,reviewCount:reviewRows.length,issueCommentCount:issueComments.length,reviewCommentCount:reviewComments.length,unresolvedThreads}};
}

if(process.argv[1]&&process.argv[1].endsWith('pos20-publication.mjs')){
  const fs=await import('node:fs');
  try{if(process.argv.length!==3)throw new Error('Usage: pos20-publication.mjs LIVE_PUBLICATION_CONFIG.json');const config=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));console.log(JSON.stringify(resolveLivePublication(config),null,2));}catch(e){console.error(e.message);process.exitCode=1;}
}
