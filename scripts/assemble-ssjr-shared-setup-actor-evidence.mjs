#!/usr/bin/env node
import fs from 'node:fs';
import { buildActorAttributedCandidateEvidence } from './ssjr-actor-evidence-v2.mjs';
function read(path,label){if(!path)throw new Error(`${label} path is required.`);return JSON.parse(fs.readFileSync(path,'utf8'));}
try{
  const [positiveOnePath,positiveTwoPath,boundOnePath,boundTwoPath,witnessPath]=process.argv.slice(2);
  const output=buildActorAttributedCandidateEvidence({positiveA:read(positiveOnePath,'first positive'),positiveB:read(positiveTwoPath,'second positive'),boundA:read(boundOnePath,'first bound actor'),boundB:read(boundTwoPath,'second bound actor'),witness:read(witnessPath,'witness')});
  process.stdout.write(`${JSON.stringify(output,null,2)}\n`);
}catch(error){process.stderr.write(`SSJR_ACTOR_EVIDENCE_ASSEMBLY_INVALID ${error.message}\n`);process.exit(1);}
