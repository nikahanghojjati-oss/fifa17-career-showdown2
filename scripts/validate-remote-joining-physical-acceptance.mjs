import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const EVIDENCE_SCHEMA="career-mode-showdown.remote-joining-physical-acceptance.v1";
export const RESULT_SCHEMA="career-mode-showdown.remote-joining-physical-acceptance-validation.v1";

const FINGERPRINT=/^[a-f0-9]{64}$/;
const RAW_CAPABILITY=/\b(?:pair|session)_[a-f0-9]{64}\b/i;
const FORBIDDEN_AUTHORITY_KEYS=new Set(["sessionid","accountid","deviceid","rivalryid"]);
const VALID_ROLES=new Set(["host","peer"]);
const ROOT_FIELDS=new Set(["schema","generatedAt","appVersion","runtimeRevision","acceptanceMode","recorderStorage","recorderNetworkRequests","rawCapabilityIncluded","rawAccountIdIncluded","rawDeviceIdIncluded","rawRivalryIdIncluded","device","deviceLabel","networkLabel","records"]);
const DEVICE_FIELDS=new Set(["userAgent","platform","maxTouchPoints","screenWidth","screenHeight"]);
const RECORD_FIELDS=new Set(["sequence","at","type","online","deviceLabel","networkLabel","capabilityFingerprint","status","role","sessionState","revision","pendingAction","capabilityPresent","capabilityCopyAllowed","busy","runtimeRevision","errorCode"]);
const ROOT_TYPES={schema:"string",generatedAt:"string",appVersion:"string",runtimeRevision:"string",acceptanceMode:"boolean",recorderStorage:"string",recorderNetworkRequests:"boolean",rawCapabilityIncluded:"boolean",rawAccountIdIncluded:"boolean",rawDeviceIdIncluded:"boolean",rawRivalryIdIncluded:"boolean",device:"object",deviceLabel:"nullable-string",networkLabel:"nullable-string",records:"array"};
const DEVICE_TYPES={userAgent:"string",platform:"string",maxTouchPoints:"integer",screenWidth:"integer",screenHeight:"integer"};
const RECORD_TYPES={sequence:"integer",at:"string",type:"string",online:"boolean",deviceLabel:"nullable-string",networkLabel:"nullable-string",capabilityFingerprint:"nullable-string",status:"nullable-string",role:"nullable-string",sessionState:"nullable-string",revision:"nullable-integer",pendingAction:"nullable-string",capabilityPresent:"boolean",capabilityCopyAllowed:"boolean",busy:"boolean",runtimeRevision:"optional-string",errorCode:"optional-string"};

function plainObject(value){return !!value&&typeof value==="object"&&!Array.isArray(value);}
function nonEmpty(value){return typeof value==="string"&&value.trim().length>0;}
function issue(code,source,message){return Object.freeze({code,source,message});}
function add(issues,condition,code,source,message){if(!condition)issues.push(issue(code,source,message));return condition;}
function normalizedKey(value){return String(value||"").replace(/[^a-z0-9]/gi,"").toLowerCase();}
function rejectUnknownFields(value,allowed,source,issues,location){
  if(!plainObject(value))return;
  for(const key of Object.keys(value)){
    if(!allowed.has(key))issues.push(issue("UNKNOWN_FIELD",source,`Unrecognized evidence field at ${location}.`));
  }
}
function validateFieldTypes(value,types,source,issues,location){
  let valid=true;
  for(const [field,descriptor] of Object.entries(types)){
    if(descriptor.startsWith("optional-")&&!Object.hasOwn(value,field))continue;
    const entry=value[field];
    if(descriptor.startsWith("nullable-")&&entry===null)continue;
    const type=descriptor.replace(/^(?:optional|nullable)-/,"");
    const matches=type==="integer"?Number.isInteger(entry)&&entry>=0:type==="object"?plainObject(entry):type==="array"?Array.isArray(entry):typeof entry===type;
    if(!matches){
      issues.push(issue("INVALID_FIELD_TYPE",source,`Invalid field type at ${location}.${field}.`));
      valid=false;
    }
  }
  return valid;
}

function inspectPrivacy(value,source,issues,location="$"){
  if(Array.isArray(value)){
    value.forEach((entry,index)=>inspectPrivacy(entry,source,issues,`${location}[${index}]`));
    return;
  }
  if(plainObject(value)){
    for(const [key,entry] of Object.entries(value)){
      if(FORBIDDEN_AUTHORITY_KEYS.has(normalizedKey(key)))issues.push(issue("RAW_AUTHORITY_FIELD",source,`Forbidden raw authority field at ${location}.`));
      // Field names are untrusted too; never echo an attacker-controlled key path.
      inspectPrivacy(entry,source,issues,`${location}.field`);
    }
    return;
  }
  if(typeof value==="string"&&RAW_CAPABILITY.test(value))issues.push(issue("RAW_CAPABILITY_VALUE",source,`A raw private capability-shaped value appears at ${location}.`));
}

function deviceSignature(device){
  if(!plainObject(device))return null;
  const facts=[String(device.userAgent||"").trim(),String(device.platform||"").trim(),Number(device.maxTouchPoints||0),Number(device.screenWidth||0),Number(device.screenHeight||0)];
  return facts.some(Boolean)?JSON.stringify(facts):null;
}

function validateSingle(evidence,source,{expectedAppVersion,expectedRuntimeRevision}){
  const issues=[];
  if(!add(issues,plainObject(evidence),"EXPORT_NOT_OBJECT",source,"Export must be a JSON object."))return {issues,facts:{}};
  inspectPrivacy(evidence,source,issues);
  rejectUnknownFields(evidence,ROOT_FIELDS,source,issues,"$");
  if(!validateFieldTypes(evidence,ROOT_TYPES,source,issues,"$"))return {issues,facts:{}};
  rejectUnknownFields(evidence.device,DEVICE_FIELDS,source,issues,"$.device");
  if(!validateFieldTypes(evidence.device,DEVICE_TYPES,source,issues,"$.device"))return {issues,facts:{}};

  add(issues,evidence.schema===EVIDENCE_SCHEMA,"SCHEMA_MISMATCH",source,"Export schema is not the supported physical acceptance schema.");
  add(issues,evidence.acceptanceMode===true,"ACCEPTANCE_MODE_REQUIRED",source,"Acceptance mode must be true.");
  add(issues,evidence.recorderStorage==="page-memory-only","RECORDER_STORAGE_UNSAFE",source,"Recorder storage must be page-memory-only.");
  add(issues,evidence.recorderNetworkRequests===false,"RECORDER_NETWORK_WRITE_UNSAFE",source,"Recorder network requests must remain false.");
  for(const field of ["rawCapabilityIncluded","rawAccountIdIncluded","rawDeviceIdIncluded","rawRivalryIdIncluded"]){
    add(issues,evidence[field]===false,"RAW_EXPORT_FLAG_UNSAFE",source,`${field} must be false.`);
  }
  add(issues,evidence.appVersion===expectedAppVersion,"APP_VERSION_MISMATCH",source,"Export application version does not match the validated production boundary.");
  add(issues,evidence.runtimeRevision===expectedRuntimeRevision,"RUNTIME_REVISION_MISMATCH",source,"Export runtime revision does not match the validated production boundary.");
  add(issues,nonEmpty(evidence.deviceLabel)&&evidence.deviceLabel.trim().length<=80,"DEVICE_LABEL_REQUIRED",source,"A concise device label is required.");
  add(issues,nonEmpty(evidence.networkLabel)&&evidence.networkLabel.trim().length<=80,"NETWORK_LABEL_REQUIRED",source,"A concise network label is required.");
  const signature=deviceSignature(evidence.device);
  add(issues,!!signature,"DEVICE_FACTS_REQUIRED",source,"Browser device facts are required.");
  add(issues,Number.isFinite(Date.parse(evidence.generatedAt)),"GENERATED_AT_INVALID",source,"generatedAt must be a valid timestamp.");

  const records=Array.isArray(evidence.records)?evidence.records:[];
  add(issues,Array.isArray(evidence.records),"RECORDS_REQUIRED",source,"records must be an array.");
  add(issues,records.length>=4&&records.length<=160,"RECORD_COUNT_INVALID",source,"Export must contain a bounded lifecycle record set.");
  let priorSequence=0;
  let priorTime=-Infinity;
  const fingerprints=new Set();
  const roles=new Set();
  for(const record of records){
    if(!plainObject(record)){issues.push(issue("RECORD_NOT_OBJECT",source,"Every lifecycle record must be an object."));continue;}
    rejectUnknownFields(record,RECORD_FIELDS,source,issues,"$.records[]");
    if(!validateFieldTypes(record,RECORD_TYPES,source,issues,"$.records[]"))continue;
    add(issues,Number.isInteger(record.sequence)&&record.sequence>priorSequence,"RECORD_SEQUENCE_INVALID",source,"Record sequence values must be strictly increasing positive integers.");
    if(Number.isInteger(record.sequence))priorSequence=record.sequence;
    const timestamp=Date.parse(record.at);
    add(issues,Number.isFinite(timestamp)&&timestamp>=priorTime,"RECORD_TIME_INVALID",source,"Record timestamps must be valid and nondecreasing.");
    if(Number.isFinite(timestamp))priorTime=timestamp;
    add(issues,typeof record.online==="boolean","ONLINE_FLAG_INVALID",source,"Every record must contain a boolean online flag.");
    if(record.capabilityFingerprint!==null&&record.capabilityFingerprint!==undefined){
      if(add(issues,FINGERPRINT.test(record.capabilityFingerprint),"FINGERPRINT_INVALID",source,"Capability fingerprints must be lowercase SHA-256 hex."))fingerprints.add(record.capabilityFingerprint);
    }
    if(record.capabilityPresent===true)add(issues,FINGERPRINT.test(record.capabilityFingerprint||""),"CAPABILITY_FINGERPRINT_MISSING",source,"Session-bearing records require a capability fingerprint.");
    if(record.role!==null&&record.role!==undefined){
      if(add(issues,VALID_ROLES.has(record.role),"ROLE_INVALID",source,"Remote Joining role must be host or peer."))roles.add(record.role);
    }
    if(record.sessionState==="active")add(issues,record.revision===1,"ACTIVE_REVISION_INVALID",source,"ACTIVE state must use revision 1.");
    if(record.sessionState==="closed")add(issues,record.revision===2,"CLOSED_REVISION_INVALID",source,"CLOSED state must use revision 2.");
  }

  add(issues,fingerprints.size===1,"SINGLE_SESSION_REQUIRED",source,"Every session-bearing checkpoint in one export must use one fingerprint.");
  add(issues,roles.size===1,"SINGLE_ROLE_REQUIRED",source,"Each physical export must preserve one manager role.");
  const role=roles.size===1?[...roles][0]:null;
  const fingerprint=fingerprints.size===1?[...fingerprints][0]:null;
  const activeIndex=records.findIndex(record=>record?.sessionState==="active"&&record?.revision===1&&record?.capabilityFingerprint===fingerprint);
  const closedIndex=records.findIndex((record,index)=>index>activeIndex&&record?.sessionState==="closed"&&record?.revision===2&&record?.capabilityFingerprint===fingerprint);
  add(issues,activeIndex>=0,"ACTIVE_REVISION_ONE_MISSING",source,"Export must show ACTIVE revision 1 for the accepted session.");
  add(issues,closedIndex>activeIndex,"CLOSED_REVISION_TWO_MISSING",source,"Export must converge from ACTIVE revision 1 to CLOSED revision 2.");
  const resurrected=closedIndex>=0&&records.slice(closedIndex+1).some(record=>["open","active","unresolved"].includes(record?.sessionState)||Number.isInteger(record?.revision)&&record.revision<2&&record.capabilityFingerprint===fingerprint);
  add(issues,!resurrected,"SESSION_RESURRECTED",source,"No open, active or earlier revision may appear after terminal CLOSED revision 2.");

  const offlineIndex=records.findIndex((record,index)=>index>activeIndex&&record?.type==="browser-offline"&&record?.online===false&&record?.capabilityFingerprint===fingerprint);
  const onlineIndex=records.findIndex((record,index)=>index>offlineIndex&&record?.type==="browser-online"&&record?.online===true&&record?.capabilityFingerprint===fingerprint);
  const orderedRecovery=activeIndex>=0&&offlineIndex>activeIndex&&onlineIndex>offlineIndex&&closedIndex>onlineIndex;

  return {issues,facts:{role,fingerprint,activeIndex,closedIndex,orderedRecovery,signature,deviceLabel:String(evidence.deviceLabel||"").trim(),networkLabel:String(evidence.networkLabel||"").trim()}};
}

export function validatePhysicalAcceptancePair(first,second,options={}){
  const expectedAppVersion=String(options.expectedAppVersion||"1.9.1");
  const expectedRuntimeRevision=String(options.expectedRuntimeRevision||"1.9.1-r2");
  const left=validateSingle(first,"first export",{expectedAppVersion,expectedRuntimeRevision});
  const right=validateSingle(second,"second export",{expectedAppVersion,expectedRuntimeRevision});
  const issues=[...left.issues,...right.issues];
  const facts=[left.facts,right.facts];
  const roles=new Set(facts.map(item=>item.role).filter(Boolean));
  const fingerprints=new Set(facts.map(item=>item.fingerprint).filter(Boolean));
  const deviceLabels=new Set(facts.map(item=>item.deviceLabel?.toLocaleLowerCase()).filter(Boolean));
  const networkLabels=new Set(facts.map(item=>item.networkLabel?.toLocaleLowerCase()).filter(Boolean));
  const signatures=new Set(facts.map(item=>item.signature).filter(Boolean));
  add(issues,roles.size===2&&roles.has("host")&&roles.has("peer"),"HOST_PEER_PAIR_REQUIRED","pair","The two exports must represent exactly one host and one peer.");
  add(issues,fingerprints.size===1&&facts.every(item=>item.fingerprint),"CROSS_DEVICE_SESSION_MISMATCH","pair","Both devices must retain the same one-way session fingerprint.");
  add(issues,deviceLabels.size===2,"DISTINCT_DEVICE_LABELS_REQUIRED","pair","The two physical device labels must be distinct.");
  add(issues,networkLabels.size===2,"DISTINCT_NETWORK_LABELS_REQUIRED","pair","The two independent network labels must be distinct.");
  add(issues,signatures.size===2,"DISTINCT_DEVICE_FACTS_REQUIRED","pair","Browser device facts must distinguish the two physical devices.");
  add(issues,facts.some(item=>item.orderedRecovery),"ORDERED_NETWORK_RECOVERY_MISSING","pair","At least one participating device must show ACTIVE revision 1, offline, online recovery and then CLOSED revision 2 in order.");

  const passed=issues.length===0;
  return Object.freeze({
    schema:RESULT_SCHEMA,
    passed,
    acceptanceEvidenceCandidate:passed,
    rjrLedgerMutated:false,
    rjrCreditAwarded:0,
    expectedProduction:{appVersion:expectedAppVersion,runtimeRevision:expectedRuntimeRevision},
    checks:Object.freeze({
      exportCount:2,
      privacySafe:!issues.some(item=>item.code.startsWith("RAW_")||item.code.includes("RECORDER_")||["UNKNOWN_FIELD","INVALID_FIELD_TYPE","EXPORT_NOT_OBJECT","RECORD_NOT_OBJECT"].includes(item.code)),
      hostPeerPair:roles.size===2&&roles.has("host")&&roles.has("peer"),
      sameSessionFingerprint:fingerprints.size===1&&facts.every(item=>item.fingerprint),
      distinctDeviceLabels:deviceLabels.size===2,
      distinctNetworkLabels:networkLabels.size===2,
      distinctDeviceFacts:signatures.size===2,
      bothActiveRevisionOne:facts.every(item=>item.activeIndex>=0),
      orderedOfflineOnlineRecovery:facts.some(item=>item.orderedRecovery),
      bothClosedRevisionTwo:facts.every(item=>item.closedIndex>item.activeIndex),
      noResurrection:!issues.some(item=>item.code==="SESSION_RESURRECTED")
    }),
    companionRuntimeProof:["npm run test:stage5h","npm run test:stage5i"],
    ledgerReconciliationRequired:true,
    issues:Object.freeze(issues)
  });
}

function readJson(file,source){
  try{return JSON.parse(fs.readFileSync(file,"utf8"));}
  catch{return {__readFailure:source};}
}

async function runCli(){
  const files=process.argv.slice(2);
  if(files.length!==2){
    process.stderr.write("Usage: npm run validate:rjr-physical -- <host-export.json> <peer-export.json>\n");
    process.exitCode=2;
    return;
  }
  const first=readJson(files[0],"first export");
  const second=readJson(files[1],"second export");
  const result=validatePhysicalAcceptancePair(first,second);
  process.stdout.write(`${JSON.stringify(result,null,2)}\n`);
  if(!result.passed)process.exitCode=1;
}

const invoked=process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url;
if(invoked)await runCli();
