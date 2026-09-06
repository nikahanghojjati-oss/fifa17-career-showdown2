import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const basePath=path.join(root,'firestore.spark.rules');
const fragmentPath=path.join(root,'firestore.shared-setup-production.fragment.rules');
const outputPath=path.join(root,'firestore.spark.generated.rules');

const base=fs.readFileSync(basePath,'utf8');
const fragment=fs.readFileSync(fragmentPath,'utf8');

function between(start,end){
  const a=fragment.indexOf(start),b=fragment.indexOf(end);
  if(a<0||b<0||b<=a)throw new Error(`Missing or invalid fragment markers: ${start} / ${end}`);
  return fragment.slice(a+start.length,b).trimEnd();
}
function once(source,needle,replacement,label){
  const first=source.indexOf(needle);
  if(first<0||source.indexOf(needle,first+needle.length)>=0)throw new Error(`Expected exactly one ${label} sentinel.`);
  return source.slice(0,first)+replacement+source.slice(first);
}

const functionMarker='// SSJR_SHARED_SETUP_FUNCTIONS_BEGIN';
const functionEnd='// SSJR_SHARED_SETUP_FUNCTIONS_END';
const matchMarker='// SSJR_SHARED_SETUP_MATCH_BEGIN';
const matchEnd='// SSJR_SHARED_SETUP_MATCH_END';
const functions=between(functionMarker,functionEnd);
const match=between(matchMarker,matchEnd);

if(base.includes('match /sharedSetup/authoritative')||base.includes('ssjrValidCreateLedger')){
  throw new Error('Base Spark Rules already contains Shared Setup authority; refuse a duplicate promotion.');
}

let generated=base;
generated=once(
  generated,
  '    function capabilityCanReadPendingRivalry(rivalryId) {',
  `    ${functionMarker}\n${functions}\n    ${functionEnd}\n\n`,
  'top-level function insertion'
);
generated=once(
  generated,
  '      // STAGE5C_CANDIDATE_SESSION_MATCH_BEGIN',
  `      ${matchMarker}\n${match}\n      ${matchEnd}\n\n`,
  'rivalry child-match insertion'
);

for(const required of [
  'match /sharedSetup/authoritative',
  'allow create: if ssjrValidCreateLedger(rivalryId)',
  'allow update: if ssjrValidUpdateLedger(rivalryId)',
  'allow list, delete: if false',
  "sessionData.state == 'active'",
  'sessionData.expiresAt > request.time',
  'device.data.data.state == \'active\'',
  "after.totalSeasons == 1 || after.totalSeasons == 3 || after.totalSeasons == 5 || after.totalSeasons == 10"
]){
  if(!generated.includes(required))throw new Error(`Generated production Rules missing required Shared Setup boundary: ${required}`);
}
if((generated.match(/match \/sharedSetup\/authoritative/g)||[]).length!==1)throw new Error('Generated production Rules must contain exactly one Shared Setup authority match.');
if(!generated.endsWith('\n'))generated+='\n';
fs.writeFileSync(outputPath,generated,'utf8');
if(process.argv.includes('--stdout'))process.stdout.write(generated);
else process.stdout.write(`BUILT ${path.basename(outputPath)} ${Buffer.byteLength(generated,'utf8')} bytes\n`);
