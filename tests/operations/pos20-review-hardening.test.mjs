import test from 'node:test';
import assert from 'node:assert/strict';
import {permanentGuardViolations,permanentGuards} from '../../scripts/pos20-cognitive-controller.mjs';
import {resolveLivePublication,requiredChecks} from '../../scripts/pos20-publication.mjs';
import {routeFiles} from '../../scripts/pos20-impact-router.mjs';

const main='b'.repeat(40);const head='a'.repeat(40);
function fakeClient(options={}){
  const changedFiles=options.changedFiles||['README.md'];const route=routeFiles(changedFiles);const checks=options.checks||requiredChecks(route).map(name=>({name,head_sha:head,status:'completed',conclusion:'success'}));
  const reviews=options.reviews||[{id:1,state:'COMMENTED',submitted_at:'2026-09-08T18:00:00Z',user:{login:'reviewer'}}];
  return {
    rest(endpoint){
      if(endpoint==='repos/o/r/pulls/7')return {state:'open',base:{ref:'main'},head:{ref:'ops/pos20',sha:options.prHead||head}};
      if(endpoint.includes('git/ref/heads/main'))return {object:{sha:main}};
      if(endpoint.includes('git/ref/heads/ops%2Fpos20'))return {object:{sha:options.candidateHead||head}};
      if(endpoint.includes('git/ref/heads/recovery%2Fpos20'))return {object:{sha:options.recoveryHead||head}};
      if(endpoint.includes('/compare/'))return {status:'ahead',merge_base_commit:{sha:options.mergeBase||main}};
      if(endpoint.includes('/files?'))return changedFiles.map(filename=>({filename}));
      if(endpoint.includes('/check-runs?'))return {total_count:checks.length,check_runs:checks};
      if(endpoint.includes('/reviews?'))return reviews;
      if(endpoint.includes('/issues/7/comments?'))return options.issueComments||[];
      if(endpoint.includes('/pulls/7/comments?'))return options.reviewComments||[];
      throw new Error(`unexpected REST endpoint ${endpoint}`);
    },
    graphql(){return {data:{repository:{pullRequest:{reviewThreads:{nodes:options.threads||[],pageInfo:{hasNextPage:false}}}}}};}
  };
}
const config={action:'MERGE',repository:'o/r',prNumber:7,candidateRef:'ops/pos20',recoveryRef:'recovery/pos20',expectedHead:head,continuityState:'READY',candidateValidation:'GREEN'};

test('permanent guard filter rejects every reviewed forbidden provider requirement directly',()=>{
  for(const action of [
    {requiresCloudFunctions:true},{requiresBlaze:true},{requiresCloudRun:true},{requiresCloudBillingAccount:true},{requiresPersistentFirestore:true},{requiresExtraOAuthScopes:true},{requiresAppCheckEnforcement:true},{requiredManagerCount:3},{firebasePlan:'Blaze'},{firestoreBrowserPersistence:'persistent'},{googleAuthPersistence:'localPersistence-extra-scopes'}
  ])assert.ok(permanentGuardViolations(action).length>0,JSON.stringify(action));
});

test('nested guardRequirements fail closed across the complete machine-readable permanent guard surface',()=>{
  assert.deepEqual(permanentGuardViolations({guardRequirements:{provider:{firebasePlan:permanentGuards.provider.firebasePlan},product:{managerCount:2},privacy:{publicMatchmaking:false}}}),[]);
  assert.ok(permanentGuardViolations({guardRequirements:{privacy:{publicMatchmaking:true}}}).length>0);
  assert.ok(permanentGuardViolations({guardRequirements:{provider:{cloudFunctionsAllowed:true}}}).length>0);
  assert.ok(permanentGuardViolations({guardRequirements:{futureUnknownGuard:true}}).length>0);
});

test('live publication preflight resolves refs, ancestry, route, checks and review threads itself',()=>{
  const decision=resolveLivePublication(config,fakeClient());
  assert.equal(decision.allowed,true);assert.equal(decision.expected_head_sha,head);assert.equal(decision.live.mainHead,main);assert.equal(decision.live.candidateHead,head);assert.equal(decision.routeProfile,'POS20_DOC_ONLY');
});

test('live publication preflight rejects branch drift and stale recovery rather than trusting captured heads',()=>{
  assert.throws(()=>resolveLivePublication(config,fakeClient({candidateHead:'c'.repeat(40)})),/disagree/);
  assert.throws(()=>resolveLivePublication(config,fakeClient({recoveryHead:'c'.repeat(40)})),/Recovery branch/);
  assert.throws(()=>resolveLivePublication(config,fakeClient({mergeBase:'c'.repeat(40)})),/descend/);
});

test('live publication preflight recomputes the changed-file route and refuses missing newly required checks',()=>{
  const docChecks=requiredChecks(routeFiles(['README.md'])).map(name=>({name,head_sha:head,status:'completed',conclusion:'success'}));
  assert.throws(()=>resolveLivePublication(config,fakeClient({changedFiles:['scripts/pos20-cognitive-controller.mjs'],checks:docChecks})),/Required exact-head check missing or red/);
});

test('live publication preflight re-reads review state and blocks unresolved or newer unreviewed conversation',()=>{
  const unresolved=[{isResolved:false,comments:{nodes:[],pageInfo:{hasNextPage:false}}}];
  assert.throws(()=>resolveLivePublication(config,fakeClient({threads:unresolved})),/Material review concerns/);
  const issueComments=[{created_at:'2026-09-08T18:01:00Z',updated_at:'2026-09-08T18:01:00Z'}];
  assert.throws(()=>resolveLivePublication(config,fakeClient({issueComments})),/Material review concerns/);
  const changes=[{id:2,state:'CHANGES_REQUESTED',submitted_at:'2026-09-08T18:02:00Z',user:{login:'reviewer'}}];
  assert.throws(()=>resolveLivePublication(config,fakeClient({reviews:changes})),/Material review concerns/);
});
