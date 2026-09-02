const fs=require('node:fs');
const patch=(path,from,to)=>{let text=fs.readFileSync(path,'utf8');if(!text.includes(from))throw new Error(`Stage 5E release-authority marker missing in ${path}`);text=text.replace(from,to);fs.writeFileSync(path,text);};
patch('PROJECT_STATE.md','Current source candidate is `v1.9.0 / 1.9.0-r1` on the bounded Stage 5E branch.','RELEASE CANDIDATE — NOT PRODUCTION-PROVEN. Current source candidate is `v1.9.0 / 1.9.0-r1` on the bounded Stage 5E branch.');
patch('NEXT_TASK.md','Current candidate: `v1.9.0 / 1.9.0-r1`.','Authorized release candidate: `v1.9.0 / 1.9.0-r1`.');
console.log('STAGE5E_RELEASE_AUTHORITY_CANDIDATE_LOCKED');
