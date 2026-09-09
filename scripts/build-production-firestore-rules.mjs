import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const basePath=path.join(root,'firestore.spark.rules');
const sharedSetupFragmentPath=path.join(root,'firestore.shared-setup-production.fragment.rules');
const careerStartFragmentPath=path.join(root,'firestore.career-start-production.fragment.rules');
const transferChallengeFragmentPath=path.join(root,'firestore.transfer-challenge-production.fragment.rules');
const seasonResultsFragmentPath=path.join(root,'firestore.season-results-production.fragment.rules');
const seasonCommitFragmentPath=path.join(root,'firestore.season-commit-production.fragment.rules');
const transferOptionsPath=path.join(root,'data/transferOptions.js');
const outputPath=path.join(root,'firestore.spark.generated.rules');

const base=fs.readFileSync(basePath,'utf8');
const sharedSetupFragment=fs.readFileSync(sharedSetupFragmentPath,'utf8');
const careerStartFragment=fs.readFileSync(careerStartFragmentPath,'utf8');
const transferChallengeFragment=fs.readFileSync(transferChallengeFragmentPath,'utf8');
const seasonResultsFragment=fs.readFileSync(seasonResultsFragmentPath,'utf8');
const seasonCommitFragment=fs.readFileSync(seasonCommitFragmentPath,'utf8');

function between(source,start,end){
  const a=source.indexOf(start),b=source.indexOf(end);
  if(a<0||b<0||b<=a)throw new Error(`Missing or invalid fragment markers: ${start} / ${end}`);
  return source.slice(a+start.length,b).trimEnd();
}
function once(source,needle,replacement,label){
  const first=source.indexOf(needle);
  if(first<0||source.indexOf(needle,first+needle.length)>=0)throw new Error(`Expected exactly one ${label} sentinel.`);
  return source.slice(0,first)+replacement+source.slice(first);
}
function replaceOnce(source,needle,replacement,label){
  const first=source.indexOf(needle);
  if(first<0||source.indexOf(needle,first+needle.length)>=0)throw new Error(`Expected exactly one ${label} seam.`);
  return source.slice(0,first)+replacement+source.slice(first+needle.length);
}
function loadTransferCatalog(){
  const sandbox={window:{}};
  vm.runInNewContext(fs.readFileSync(transferOptionsPath,'utf8'),sandbox,{filename:'data/transferOptions.js'});
  const leagues=sandbox.window.FIFA17_TRANSFER_LEAGUES;
  const nationalities=sandbox.window.FIFA17_TRANSFER_NATIONALITIES;
  if(!Array.isArray(leagues)||leagues.length!==36||!Array.isArray(nationalities)||nationalities.length!==164)throw new Error('Canonical FIFA 17 Transfer Challenge catalog shape changed unexpectedly.');
  const normalize=(items,label)=>{
    const ids=items.map(item=>item&&item.id);
    if(ids.some(id=>typeof id!=='string'||!id.matches&&false)){}
    if(ids.some(id=>typeof id!=='string'||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)))throw new Error(`Canonical ${label} catalog contains an invalid Rules ID.`);
    if(new Set(ids).size!==ids.length)throw new Error(`Canonical ${label} catalog contains duplicate IDs.`);
    return ids;
  };
  return {leagueIds:normalize(leagues,'league'),nationalityIds:normalize(nationalities,'nationality')};
}
function rulesList(ids){return `[${ids.map(id=>`'${id}'`).join(',')}]`;}
function injectTransferCatalog(functions){
  const {leagueIds,nationalityIds}=loadTransferCatalog();
  const generic="    function ssjrTransferValidOptionId(value) { return value is string && value.size() >= 2 && value.size() <= 80 && value.matches('^[a-z0-9]+(-[a-z0-9]+)*$'); }";
  let output=replaceOnce(functions,generic,`${generic}\n    function ssjrTransferValidLeagueId(value) { return value in ${rulesList(leagueIds)}; }\n    function ssjrTransferValidNationalityId(value) { return value in ${rulesList(nationalityIds)}; }`,'Transfer Challenge catalog helper');
  output=replaceOnce(output,"        && (value.type == 'league' || value.type == 'nationality')\n        && ssjrTransferValidOptionId(value.valueId);","        && ((value.type == 'league' && ssjrTransferValidLeagueId(value.valueId))\n          || (value.type == 'nationality' && ssjrTransferValidNationalityId(value.valueId)));",'Transfer Challenge guess catalog validation');
  output=replaceOnce(output,'        && ssjrTransferValidOptionId(value.leagueId)\n        && ssjrTransferValidOptionId(value.nationalityId);','        && ssjrTransferValidLeagueId(value.leagueId)\n        && ssjrTransferValidNationalityId(value.nationalityId);','Transfer Challenge signing catalog validation');
  return output;
}

const sharedFunctionMarker='// SSJR_SHARED_SETUP_FUNCTIONS_BEGIN';
const sharedFunctionEnd='// SSJR_SHARED_SETUP_FUNCTIONS_END';
const sharedMatchMarker='// SSJR_SHARED_SETUP_MATCH_BEGIN';
const sharedMatchEnd='// SSJR_SHARED_SETUP_MATCH_END';
const careerFunctionMarker='// SSJR_CAREER_START_FUNCTIONS_BEGIN';
const careerFunctionEnd='// SSJR_CAREER_START_FUNCTIONS_END';
const careerMatchMarker='// SSJR_CAREER_START_MATCH_BEGIN';
const careerMatchEnd='// SSJR_CAREER_START_MATCH_END';
const transferFunctionMarker='// SSJR_TRANSFER_CHALLENGE_FUNCTIONS_BEGIN';
const transferFunctionEnd='// SSJR_TRANSFER_CHALLENGE_FUNCTIONS_END';
const transferMatchMarker='// SSJR_TRANSFER_CHALLENGE_MATCH_BEGIN';
const transferMatchEnd='// SSJR_TRANSFER_CHALLENGE_MATCH_END';
const resultsFunctionMarker='// SSJR_SEASON_RESULTS_FUNCTIONS_BEGIN';
const resultsFunctionEnd='// SSJR_SEASON_RESULTS_FUNCTIONS_END';
const resultsMatchMarker='// SSJR_SEASON_RESULTS_MATCH_BEGIN';
const resultsMatchEnd='// SSJR_SEASON_RESULTS_MATCH_END';
const commitFunctionMarker='// SSJR_SEASON_COMMIT_FUNCTIONS_BEGIN';
const commitFunctionEnd='// SSJR_SEASON_COMMIT_FUNCTIONS_END';
const commitMatchMarker='// SSJR_SEASON_COMMIT_MATCH_BEGIN';
const commitMatchEnd='// SSJR_SEASON_COMMIT_MATCH_END';
const sharedFunctions=between(sharedSetupFragment,sharedFunctionMarker,sharedFunctionEnd);
const sharedMatch=between(sharedSetupFragment,sharedMatchMarker,sharedMatchEnd);
const careerFunctions=between(careerStartFragment,careerFunctionMarker,careerFunctionEnd);
const careerMatch=between(careerStartFragment,careerMatchMarker,careerMatchEnd);
const transferFunctions=injectTransferCatalog(between(transferChallengeFragment,transferFunctionMarker,transferFunctionEnd));
const transferMatch=between(transferChallengeFragment,transferMatchMarker,transferMatchEnd);
const resultsFunctions=between(seasonResultsFragment,resultsFunctionMarker,resultsFunctionEnd);
const resultsMatch=between(seasonResultsFragment,resultsMatchMarker,resultsMatchEnd);
const commitFunctions=between(seasonCommitFragment,commitFunctionMarker,commitFunctionEnd);
const commitMatch=between(seasonCommitFragment,commitMatchMarker,commitMatchEnd);

if(
  base.includes('match /sharedSetup/authoritative')
  || base.includes('ssjrValidCreateLedger')
  || base.includes('match /careerStart/authoritative')
  || base.includes('ssjrCareerValidCreate')
  || base.includes('match /transferChallenges/{transferId}')
  || base.includes('ssjrTransferValidCreate')
  || base.includes('match /seasonResults/{seasonId}')
  || base.includes('ssjrResultsValidCreate')
  || base.includes('match /seasonCommits/{seasonId}')
  || base.includes('ssjrCommitValidCreate')
){
  throw new Error('Base Spark Rules already contains Shared Setup, Career Start, Transfer Challenge, Season Results or Season Commit authority; refuse a duplicate promotion.');
}

let generated=base;
generated=once(generated,'    function capabilityCanReadPendingRivalry(rivalryId) {',`    ${sharedFunctionMarker}\n${sharedFunctions}\n    ${sharedFunctionEnd}\n\n    ${careerFunctionMarker}\n${careerFunctions}\n    ${careerFunctionEnd}\n\n    ${transferFunctionMarker}\n${transferFunctions}\n    ${transferFunctionEnd}\n\n    ${resultsFunctionMarker}\n${resultsFunctions}\n    ${resultsFunctionEnd}\n\n    ${commitFunctionMarker}\n${commitFunctions}\n    ${commitFunctionEnd}\n\n`,'top-level function insertion');
generated=once(generated,'      // STAGE5C_CANDIDATE_SESSION_MATCH_BEGIN',`      ${sharedMatchMarker}\n${sharedMatch}\n      ${sharedMatchEnd}\n\n      ${careerMatchMarker}\n${careerMatch}\n      ${careerMatchEnd}\n\n      ${transferMatchMarker}\n${transferMatch}\n      ${transferMatchEnd}\n\n      ${resultsMatchMarker}\n${resultsMatch}\n      ${resultsMatchEnd}\n\n      ${commitMatchMarker}\n${commitMatch}\n      ${commitMatchEnd}\n\n`,'rivalry child-match insertion');

for(const required of [
  'match /sharedSetup/authoritative',
  'allow create: if ssjrValidCreateLedger(rivalryId)',
  'allow update: if ssjrValidUpdateLedger(rivalryId)',
  'match /careerStart/authoritative',
  'allow create: if ssjrCareerValidCreate(rivalryId)',
  'allow update: if ssjrCareerValidUpdate(rivalryId)',
  'match /transferChallenges/{transferId}',
  'allow create: if ssjrTransferValidCreate(rivalryId, transferId)',
  'allow update: if ssjrTransferValidUpdate(rivalryId, transferId)',
  'allow create: if ssjrTransferPrivateCreateValid(rivalryId, transferId, managerRole)',
  'allow update: if ssjrTransferPrivateUpdateValid(rivalryId, transferId, managerRole)',
  'function ssjrTransferValidLeagueId(value)',
  'function ssjrTransferValidNationalityId(value)',
  'ssjrTransferValidLeagueId(value.leagueId)',
  'ssjrTransferValidNationalityId(value.nationalityId)',
  'match /seasonResults/{seasonId}',
  'allow create: if ssjrResultsValidCreate(rivalryId, seasonId)',
  'allow update: if ssjrResultsValidUpdate(rivalryId, seasonId)',
  'allow create: if ssjrResultsPrivateCreateValid(rivalryId, seasonId, managerRole)',
  "managerRole == ssjrActorRole(rivalryId) || public.phase == 'RESULTS_READY'",
  'match /seasonCommits/{seasonId}',
  'allow create: if ssjrCommitValidCreate(rivalryId, seasonId)',
  'allow update: if ssjrCommitValidUpdate(rivalryId, seasonId)',
  "root.runtimeRevision == '1.9.1-r10'",
  "public.phase == 'RESULTS_READY'",
  "role == setup.coordinatorRole",
  "root.results.playerOne == p1.result",
  "root.results.playerTwo == p2.result",
  "root.phase == 'ACKNOWLEDGED'",
  "career.setupOperationIds == setup.operationIds",
  "transfer.phase == 'COMPLETED'",
  "transfer.revision == 6 || transfer.revision == 7",
  "value.keys().hasOnly(['leaguePosition','leaguePoints','leagueGoals','domesticCup','championsLeague','topScorer','topAssist'])",
  'getAfter(/databases/$(database)/documents/rivalries/$(rivalryId)/seasonResults/$(seasonId)/roles/$(managerRole))',
  'allow list, update, delete: if false',
  'allow list, delete: if false',
  "sessionData.state == 'active'",
  'sessionData.expiresAt > request.time',
  "device.data.data.state == 'active'",
  "after.totalSeasons == 1 || after.totalSeasons == 3 || after.totalSeasons == 5 || after.totalSeasons == 10",
  "setup.phase == 'SHOWDOWN_CONFIRMED'",
  "after.phase == 'CAREER_START_READY'",
  "request.time >= before.startedAt + duration.value(15, 'm')",
  "managerRole == ssjrActorRole(rivalryId) || public.phase == 'COMPLETED'",
  'getAfter(/databases/$(database)/documents/rivalries/$(rivalryId)/transferChallenges/$(transferId)/roles/$(role))'
]){
  if(!generated.includes(required))throw new Error(`Generated production Rules missing required Shared Journey boundary: ${required}`);
}
if((generated.match(/match \/sharedSetup\/authoritative/g)||[]).length!==1)throw new Error('Generated production Rules must contain exactly one Shared Setup authority match.');
if((generated.match(/match \/careerStart\/authoritative/g)||[]).length!==1)throw new Error('Generated production Rules must contain exactly one Career Start authority match.');
if((generated.match(/match \/transferChallenges\/\{transferId\}/g)||[]).length!==1)throw new Error('Generated production Rules must contain exactly one Transfer Challenge authority match.');
if((generated.match(/match \/seasonResults\/\{seasonId\}/g)||[]).length!==1)throw new Error('Generated production Rules must contain exactly one Shared Season Results authority match.');
if((generated.match(/match \/seasonCommits\/\{seasonId\}/g)||[]).length!==1)throw new Error('Generated production Rules must contain exactly one Shared Season Commit authority match.');
if((generated.match(/match \/roles\/\{managerRole\}/g)||[]).length!==2)throw new Error('Generated production Rules must contain exactly two role-private matches: Transfer Challenge and Season Results.');
if(!generated.endsWith('\n'))generated+='\n';
fs.writeFileSync(outputPath,generated,'utf8');
if(process.argv.includes('--stdout'))process.stdout.write(generated);
else process.stdout.write(`BUILT ${path.basename(outputPath)} ${Buffer.byteLength(generated,'utf8')} bytes\n`);