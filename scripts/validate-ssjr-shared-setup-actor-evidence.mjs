#!/usr/bin/env node
import fs from 'node:fs';
import { buildActorAttributedEvidence, PRODUCTION_AUTHENTICATION_CODE } from './ssjr-actor-evidence-v2.mjs';
function read(path,label){if(!path)throw new Error(`${label} path is required.`);return JSON.parse(fs.readFileSync(path,'utf8'));}
try{
  const [positiveOnePath,positiveTwoPath,boundOnePath,boundTwoPath,witnessPath]=process.argv.slice(2);
  const evidence=buildActorAttributedEvidence({positiveA:read(positiveOnePath,'first positive'),positiveB:read(positiveTwoPath,'second positive'),boundA:read(boundOnePath,'first bound actor'),boundB:read(boundTwoPath,'second bound actor'),witness:read(witnessPath,'witness')});
  if(evidence.productionProvenanceAuthenticated!==true||evidence.productionEvidenceAccepted!==true)throw new Error(`${PRODUCTION_AUTHENTICATION_CODE}: Offline browser-export JSON is candidate-only and cannot validate as production evidence.`);
  process.stdout.write(`${JSON.stringify({ok:true,evidenceType:evidence.evidenceType,runtimeRevision:evidence.runtimeRevision,productionEvidenceAccepted:true,ssjrCreditGranted:false,mdpCreditGranted:false},null,2)}\n`);
}catch(error){process.stderr.write(`SSJR_ACTOR_EVIDENCE_INVALID ${error.message}\n`);process.exit(1);}
