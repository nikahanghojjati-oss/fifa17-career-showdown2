import fs from 'node:fs';
import crypto from 'node:crypto';

const project=process.env.FIREBASE_PROJECT_ID;
const rulesFile=process.env.FIREBASE_RULES_FILE;
const credentialsPath=process.env.GOOGLE_APPLICATION_CREDENTIALS;
if(project!=='fifa17-career-showdown-prod')throw new Error(`Refusing unexpected Firebase project ${project||'(missing)'}.`);
if(!rulesFile||!fs.existsSync(rulesFile))throw new Error('Generated production Rules file is missing.');
if(!credentialsPath||!fs.existsSync(credentialsPath))throw new Error('GOOGLE_APPLICATION_CREDENTIALS is missing.');
const credentials=JSON.parse(fs.readFileSync(credentialsPath,'utf8'));
if(!credentials.client_email||!credentials.private_key)throw new Error('ADC service-account credential is incomplete.');
const local=fs.readFileSync(rulesFile,'utf8');

function base64urlJson(value){return Buffer.from(JSON.stringify(value),'utf8').toString('base64url');}
function gitBlobSha(content){
  const bytes=Buffer.from(content,'utf8');
  return crypto.createHash('sha1').update(Buffer.from(`blob ${bytes.length}\0`,'utf8')).update(bytes).digest('hex');
}
async function mintAccessToken(){
  const now=Math.floor(Date.now()/1000);
  const unsigned=[base64urlJson({alg:'RS256',typ:'JWT'}),base64urlJson({iss:credentials.client_email,scope:'https://www.googleapis.com/auth/cloud-platform',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600})].join('.');
  const signature=crypto.sign('RSA-SHA256',Buffer.from(unsigned,'utf8'),credentials.private_key).toString('base64url');
  const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:`${unsigned}.${signature}`})});
  const text=await response.text();
  if(!response.ok)throw new Error(`Google OAuth token exchange failed with HTTP ${response.status}.`);
  const body=JSON.parse(text);if(!body.access_token)throw new Error('Google OAuth token exchange returned no access_token.');return body.access_token;
}
async function rulesRequest(method,path,token,body=null,allow404=false){
  const response=await fetch(`https://firebaserules.googleapis.com/v1/${path}`,{method,headers:{Authorization:`Bearer ${token}`,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
  const text=await response.text();
  if(allow404&&response.status===404)return null;
  if(!response.ok)throw new Error(`Firebase Rules API ${method} ${path} failed with HTTP ${response.status}: ${text}`);
  return text?JSON.parse(text):{};
}

const token=await mintAccessToken();
// Creating a ruleset compiles/validates the generated source before any release pointer changes.
const ruleset=await rulesRequest('POST',`projects/${project}/rulesets`,token,{source:{files:[{name:'firestore.rules',content:local}]}});
if(!ruleset?.name?.startsWith(`projects/${project}/rulesets/`))throw new Error('Firebase Rules API did not return a valid compiled ruleset name.');
const releasePath=`projects/${project}/releases/cloud.firestore`;
const existing=await rulesRequest('GET',releasePath,token,null,true);
const release=existing
  ? await rulesRequest('PATCH',releasePath,token,{release:{name:releasePath,rulesetName:ruleset.name},updateMask:'rulesetName'})
  : await rulesRequest('POST',`projects/${project}/releases`,token,{name:releasePath,rulesetName:ruleset.name});
if(release?.rulesetName!==ruleset.name)throw new Error('Firebase Rules release did not point to the freshly compiled ruleset.');
const liveRelease=await rulesRequest('GET',releasePath,token);
const liveRuleset=await rulesRequest('GET',liveRelease.rulesetName,token);
const exact=(liveRuleset?.source?.files||[]).filter(file=>file?.content===local);
if(exact.length!==1)throw new Error('Provider source did not exactly match generated production authority after publication.');
const localBlob=gitBlobSha(local),providerBlob=gitBlobSha(exact[0].content);
if(localBlob!==providerBlob)throw new Error(`Provider blob mismatch: local=${localBlob} provider=${providerBlob}`);
console.log(`PROVIDER_FIRESTORE_RULES_RELEASE_UPDATED ${ruleset.name}`);
console.log(`PROVIDER_FIRESTORE_RULES_EXACT_SOURCE_PASS ${providerBlob}`);
console.log(`Provider release: ${liveRelease.name}`);
console.log(`Provider ruleset: ${liveRelease.rulesetName}`);
