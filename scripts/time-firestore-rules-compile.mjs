import fs from 'node:fs';
import crypto from 'node:crypto';

// Fable job 19 (r88 Rules slimming): measure how long the Firebase Rules service takes to COMPILE a Rules source.
// It calls only `projects/{project}:test` with no test suite, which compiles the source and reports issues. It never
// creates a ruleset, never touches a release, and retries nothing: a 503 is recorded as a data point, because the
// 2.1.0 deploy got HTTP 503 after about 5.3 s on every ruleset create (the service's compile deadline), and this
// probe exists to tell a slow compile from an outage before the next deploy.
//
// Usage: FIREBASE_PROJECT_ID=... GOOGLE_APPLICATION_CREDENTIALS=... node scripts/time-firestore-rules-compile.mjs \
//   [--repeat N] label=path/to/rules [label=path ...]
// Output: one `RULES_COMPILE label=<label> attempt=<n> status=<http> ms=<elapsed> issues=<count> bytes=<size>` line
// per call, then one `RULES_COMPILE_SUMMARY label=<label> ok=<n>/<total> minMs=<min> maxMs=<max>` line per label.

const project=process.env.FIREBASE_PROJECT_ID;
const credentialsPath=process.env.GOOGLE_APPLICATION_CREDENTIALS;
if(project!=='fifa17-career-showdown-prod')throw new Error(`Refusing unexpected Firebase project ${project||'(missing)'}.`);
if(!credentialsPath||!fs.existsSync(credentialsPath))throw new Error('GOOGLE_APPLICATION_CREDENTIALS is missing.');
const credentials=JSON.parse(fs.readFileSync(credentialsPath,'utf8'));
if(!credentials.client_email||!credentials.private_key)throw new Error('ADC service-account credential is incomplete.');

const args=process.argv.slice(2);
let repeat=3;
const targets=[];
for(let i=0;i<args.length;i+=1){
  if(args[i]==='--repeat'){repeat=Number(args[i+1]);i+=1;continue;}
  const eq=args[i].indexOf('=');
  if(eq<=0)throw new Error(`Expected label=path, got ${args[i]}`);
  targets.push({label:args[i].slice(0,eq),path:args[i].slice(eq+1)});
}
if(!Number.isInteger(repeat)||repeat<1||repeat>10)throw new Error('--repeat must be an integer from 1 to 10.');
if(targets.length===0)throw new Error('Give at least one label=path.');
for(const target of targets){
  if(!fs.existsSync(target.path))throw new Error(`Rules file is missing: ${target.path}`);
  target.content=fs.readFileSync(target.path,'utf8');
}

function base64urlJson(value){return Buffer.from(JSON.stringify(value),'utf8').toString('base64url');}
async function mintAccessToken(){
  const now=Math.floor(Date.now()/1000);
  const unsigned=[base64urlJson({alg:'RS256',typ:'JWT'}),base64urlJson({iss:credentials.client_email,scope:'https://www.googleapis.com/auth/cloud-platform',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600})].join('.');
  const signature=crypto.sign('RSA-SHA256',Buffer.from(unsigned,'utf8'),credentials.private_key).toString('base64url');
  const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:`${unsigned}.${signature}`})});
  const text=await response.text();
  if(!response.ok)throw new Error(`Google OAuth token exchange failed with HTTP ${response.status}.`);
  const body=JSON.parse(text);if(!body.access_token)throw new Error('Google OAuth token exchange returned no access_token.');return body.access_token;
}

const token=await mintAccessToken();
// Compile-only endpoint. No ruleset is stored and no release changes.
const url=`https://firebaserules.googleapis.com/v1/projects/${project}:test`;
const summary=[];
for(const target of targets){
  const results=[];
  for(let attempt=1;attempt<=repeat;attempt+=1){
    const started=process.hrtime.bigint();
    let status='network',issues='-',detail='';
    try{
      const response=await fetch(url,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({source:{files:[{name:'firestore.rules',content:target.content}]}})});
      const text=await response.text();
      status=response.status;
      if(response.ok){
        const body=text?JSON.parse(text):{};
        issues=Array.isArray(body.issues)?body.issues.length:0;
        if(issues>0)detail=' '+JSON.stringify(body.issues.slice(0,3));
      }else{
        detail=' '+text.replace(/\s+/g,' ').slice(0,200);
      }
    }catch(error){
      detail=' '+String(error?.message||error).slice(0,200);
    }
    const ms=Number((process.hrtime.bigint()-started)/1000000n);
    results.push({status,ms});
    console.log(`RULES_COMPILE label=${target.label} attempt=${attempt} status=${status} ms=${ms} issues=${issues} bytes=${Buffer.byteLength(target.content,'utf8')}${detail}`);
  }
  const ok=results.filter(result=>result.status===200);
  summary.push(`RULES_COMPILE_SUMMARY label=${target.label} ok=${ok.length}/${results.length} minMs=${Math.min(...results.map(r=>r.ms))} maxMs=${Math.max(...results.map(r=>r.ms))}`);
}
for(const line of summary)console.log(line);
