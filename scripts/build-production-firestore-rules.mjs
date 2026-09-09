import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const basePath=path.join(root,'firestore.spark.rules');
const sharedSetupFragmentPath=path.join(root,'firestore.shared-setup-production.fragment.rules');
const careerStartFragmentPath=path.join(root,'firestore.career-start-production.fragment.rules');
const outputPath=path.join(root,'firestore.spark.generated.rules');

const base=fs.readFileSync(basePath,'utf8');
const sharedSetupFragment=fs.readFileSync(sharedSetupFragmentPath,'utf8');
const careerStartFragment=fs.readFileSync(careerStartFragmentPath,'utf8');

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

const sharedFunctionMarker='// SSJR_SHARED_SETUP_FUNCTIONS_BEGIN';
const sharedFunctionEnd='// SSJR_SHARED_SETUP_FUNCTIONS_END';
const sharedMatchMarker='// SSJR_SHARED_SETUP_MATCH_BEGIN';
const sharedMatchEnd='// SSJR_SHARED_SETUP_MATCH_END';
const careerFunctionMarker='// SSJR_CAREER_START_FUNCTIONS_BEGIN';
const careerFunctionEnd='// SSJR_CAREER_START_FUNCTIONS_END';
const careerMatchMarker='// SSJR_CAREER_START_MATCH_BEGIN';
const careerMatchEnd='// SSJR_CAREER_START_MATCH_END';
const sharedFunctions=between(sharedSetupFragment,sharedFunctionMarker,sharedFunctionEnd);
const sharedMatch=between(sharedSetupFragment,sharedMatchMarker,sharedMatchEnd);
const careerFunctions=between(careerStartFragment,careerFunctionMarker,careerFunctionEnd);
const careerMatch=between(careerStartFragment,careerMatchMarker,careerMatchEnd);

if(base.includes('match /sharedSetup/authoritative')||base.includes('ssjrValidCreateLedger')||base.includes('match /careerStart/authoritative')||base.includes('ssjrCareerValidCreate')){
  throw new Error('Base Spark Rules already contains Shared Setup or Career Start authority; refuse a duplicate promotion.');
}

let generated=base;
generated=once(
  generated,
  '    function capabilityCanReadPendingRivalry(rivalryId) {',
  `    ${sharedFunctionMarker}\n${sharedFunctions}\n    ${sharedFunctionEnd}\n\n    ${careerFunctionMarker}\n${careerFunctions}\n    ${careerFunctionEnd}\n\n`,
  'top-level function insertion'
);
generated=once(
  generated,
  '      // STAGE5C_CANDIDATE_SESSION_MATCH_BEGIN',
  `      ${sharedMatchMarker}\n${sharedMatch}\n      ${sharedMatchEnd}\n\n      ${careerMatchMarker}\n${careerMatch}\n      ${careerMatchEnd}\n\n`,
  'rivalry child-match insertion'
);

for(const required of [
  'match /sharedSetup/authoritative',
  'allow create: if ssjrValidCreateLedger(rivalryId)',
  'allow update: if ssjrValidUpdateLedger(rivalryId)',
  'match /careerStart/authoritative',
  'allow create: if ssjrCareerValidCreate(rivalryId)',
  'allow update: if ssjrCareerValidUpdate(rivalryId)',
  'allow list, delete: if false',
  "sessionData.state == 'active'",
  'sessionData.expiresAt > request.time',
  "device.data.data.state == 'active'",
  "after.totalSeasons == 1 || after.totalSeasons == 3 || after.totalSeasons == 5 || after.totalSeasons == 10",
  "setup.phase == 'SHOWDOWN_CONFIRMED'",
  "after.phase == 'CAREER_START_READY'"
]){
  if(!generated.includes(required))throw new Error(`Generated production Rules missing required Shared Journey boundary: ${required}`);
}
if((generated.match(/match \/sharedSetup\/authoritative/g)||[]).length!==1)throw new Error('Generated production Rules must contain exactly one Shared Setup authority match.');
if((generated.match(/match \/careerStart\/authoritative/g)||[]).length!==1)throw new Error('Generated production Rules must contain exactly one Career Start authority match.');
if(!generated.endsWith('\n'))generated+='\n';
fs.writeFileSync(outputPath,generated,'utf8');
if(process.argv.includes('--stdout'))process.stdout.write(generated);
else process.stdout.write(`BUILT ${path.basename(outputPath)} ${Buffer.byteLength(generated,'utf8')} bytes\n`);
