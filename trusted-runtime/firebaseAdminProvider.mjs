import crypto from "node:crypto";
import {applicationDefault,getApps,initializeApp} from "firebase-admin/app";
import {getAppCheck} from "firebase-admin/app-check";
import {getAuth} from "firebase-admin/auth";
import {getFirestore,Timestamp} from "firebase-admin/firestore";

const EXPECTED_PROJECT_ID="fifa17-career-showdown-prod";

function isRecord(value){
  return Boolean(value)&&typeof value==="object"&&!Array.isArray(value);
}

function canonicalize(value){
  if(value instanceof Timestamp){
    return {"@type":"firestore-timestamp",seconds:value.seconds,nanoseconds:value.nanoseconds};
  }
  if(value===null||typeof value!=="object")return value;
  if(Array.isArray(value))return value.map(canonicalize);
  const output={};
  for(const key of Object.keys(value).sort())output[key]=canonicalize(value[key]);
  return output;
}

function stableStringify(value){
  if(value===null||typeof value!=="object")return JSON.stringify(value);
  if(Array.isArray(value))return `[${value.map(stableStringify).join(",")}]`;
  return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
}

function canonicalContentHash(data){
  const canonical=stableStringify(canonicalize(data));
  return `sha256:${crypto.createHash("sha256").update(canonical,"utf8").digest("hex")}`;
}

function materializeInitialAccount(createSpec){
  if(!isRecord(createSpec)||createSpec.objectType!=="account"||createSpec.revision!==0||createSpec.lifecycleState!=="live"){
    throw new Error("PRODUCTION_ACCOUNT_CREATE_SPEC_INVALID");
  }
  if(!isRecord(createSpec.trustedMaterialization)||createSpec.trustedMaterialization.canonicalContentHashRequired!==true){
    throw new Error("PRODUCTION_ACCOUNT_HASH_MATERIALIZATION_REQUIRED");
  }
  const timestampFields=createSpec.trustedMaterialization.serverTimestampFields;
  if(!Array.isArray(timestampFields)||timestampFields.length!==2||timestampFields[0]!=="data.createdAt"||timestampFields[1]!=="updatedAt"){
    throw new Error("PRODUCTION_ACCOUNT_TIMESTAMP_MATERIALIZATION_INVALID");
  }

  const trustedNow=Timestamp.now();
  const data={
    status:createSpec.data.status,
    createdAt:trustedNow,
    deletionRequestedAt:createSpec.data.deletionRequestedAt
  };
  return Object.freeze({
    schemaVersion:createSpec.schemaVersion,
    objectType:createSpec.objectType,
    objectId:createSpec.objectId,
    revision:createSpec.revision,
    parentRevision:createSpec.parentRevision,
    lifecycleState:createSpec.lifecycleState,
    contentHash:canonicalContentHash(data),
    priorContentHash:createSpec.priorContentHash,
    updatedAt:trustedNow,
    updatedByAccountId:createSpec.updatedByAccountId,
    updatedByDeviceId:createSpec.updatedByDeviceId,
    data,
    tombstone:createSpec.tombstone
  });
}

function assertProductionCredentialBoundary(){
  if(process.env.GOOGLE_APPLICATION_CREDENTIALS){
    throw new Error("PRODUCTION_EXPORTED_SERVICE_ACCOUNT_CREDENTIAL_FORBIDDEN");
  }
  const runtimeProject=process.env.GOOGLE_CLOUD_PROJECT||process.env.GCLOUD_PROJECT||null;
  if(runtimeProject&&runtimeProject!==EXPECTED_PROJECT_ID){
    throw new Error("PRODUCTION_TRUSTED_RUNTIME_PROJECT_MISMATCH");
  }
}

function getProductionApp(){
  assertProductionCredentialBoundary();
  const existing=getApps().find(app=>app.name==="[DEFAULT]");
  if(existing)return existing;
  return initializeApp({
    credential:applicationDefault(),
    projectId:EXPECTED_PROJECT_ID
  });
}

export function createFirebaseAdminProductionProvider(){
  const app=getProductionApp();
  const auth=getAuth(app);
  const appCheck=getAppCheck(app);
  const firestore=getFirestore(app);

  return Object.freeze({
    verifyAppCheckToken:token=>appCheck.verifyToken(token),
    verifyIdToken:(token,checkRevoked)=>auth.verifyIdToken(token,checkRevoked),
    runAtomicAccountBootstrap:request=>firestore.runTransaction(async transaction=>{
      if(!request||typeof request.accountId!=="string"||request.documentPath!==`accounts/${request.accountId}`){
        throw new Error("PRODUCTION_ACCOUNT_TRANSACTION_SCOPE_INVALID");
      }
      const accountRef=firestore.doc(request.documentPath);
      const snapshot=await transaction.get(accountRef);
      const existingAccount=snapshot.exists?snapshot.data():null;
      const decision=request.decide(existingAccount);
      if(decision&&decision.ok===true&&decision.action==="create"){
        transaction.create(accountRef,materializeInitialAccount(request.createSpec));
        return {committed:true,decision};
      }
      return {committed:false,decision};
    })
  });
}

export const productionFirebaseAdminProviderPolicy=Object.freeze({
  projectId:EXPECTED_PROJECT_ID,
  credentialStrategy:"application-default-credentials",
  exportedServiceAccountKeyAllowed:false,
  firestoreWriteMode:"transactional-create-only",
  canonicalHashAlgorithm:"sha256-over-recursively-sorted-canonical-json",
  canonicalTimestampEncoding:"firestore-seconds-nanoseconds",
  browserFirestoreWrites:"deny-all"
});
