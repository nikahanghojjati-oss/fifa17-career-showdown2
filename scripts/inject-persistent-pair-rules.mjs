import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const fragmentPath=path.join(root,'firestore.persistent-pair-production.fragment.rules');
const outputPath=path.join(root,'firestore.spark.generated.rules');
const functionStart='// CMS_PERSISTENT_PAIR_FUNCTIONS_BEGIN';
const functionEnd='// CMS_PERSISTENT_PAIR_FUNCTIONS_END';
const matchStart='// CMS_PERSISTENT_PAIR_MATCH_BEGIN';
const matchEnd='// CMS_PERSISTENT_PAIR_MATCH_END';

function between(source,start,end){
  const a=source.indexOf(start),b=source.indexOf(end);
  if(a<0||b<0||b<=a)throw new Error(`Missing or invalid persistent pair fragment markers: ${start} / ${end}`);
  return source.slice(a+start.length,b).trim();
}

function insertOnce(source,needle,replacement,label){
  const first=source.indexOf(needle);
  if(first<0||source.indexOf(needle,first+needle.length)>=0)throw new Error(`Expected exactly one ${label} sentinel.`);
  return source.slice(0,first)+replacement+source.slice(first);
}

export function injectPersistentPairRules(){
  const fragment=fs.readFileSync(fragmentPath,'utf8');
  let generated=fs.readFileSync(outputPath,'utf8');
  if(generated.includes(functionStart)||generated.includes(matchStart)||generated.includes('match /accounts/{accountId}/pairLinks/{pairId}')){
    throw new Error('Generated production Rules already contain persistent pair authority; refuse duplicate injection.');
  }
  const functions=between(fragment,functionStart,functionEnd);
  const match=between(fragment,matchStart,matchEnd);
  generated=insertOnce(generated,'    function capabilityCanReadPendingRivalry(rivalryId) {',`${functionStart}\n${functions}\n    ${functionEnd}\n\n    `,'persistent pair function');
  generated=insertOnce(generated,'    match /rivalries/{rivalryId} {',`${matchStart}\n${match}\n    ${matchEnd}\n\n    `,'persistent pair match');
  for(const required of [
    'function cmsPersistentPairManagerValid(managerId)',
    'function cmsPersistentPairRivalryMembership(accountId, rivalryId, role)',
    'function cmsPersistentPairCreateValid(accountId, pairId)',
    'function cmsPersistentPairUpdateValid(accountId, pairId)',
    "managerId == 'daniel' || managerId == 'nik'",
    'after.data.managerRole == before.data.managerRole',
    'after.data.managerId == before.data.managerId',
    'match /accounts/{accountId}/pairLinks/{pairId}',
    "allow get: if signedIn() && request.auth.uid == accountId && pairId == 'current'",
    'allow create: if cmsPersistentPairCreateValid(accountId, pairId)',
    'allow update: if cmsPersistentPairUpdateValid(accountId, pairId)',
    'allow list, delete: if false'
  ]){
    if(!generated.includes(required))throw new Error(`Generated production Rules missing persistent pair boundary: ${required}`);
  }
  if((generated.match(/match \/accounts\/\{accountId\}\/pairLinks\/\{pairId\}/g)||[]).length!==1){
    throw new Error('Generated production Rules must contain exactly one persistent pair account match.');
  }
  if(!generated.endsWith('\n'))generated+='\n';
  fs.writeFileSync(outputPath,generated,'utf8');
  return generated;
}
