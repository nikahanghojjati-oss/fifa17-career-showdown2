import http from "node:http";
import {createRequire} from "node:module";
import {createFirebaseAdminProductionProvider} from "./firebaseAdminProvider.mjs";

const require=createRequire(import.meta.url);
const productionTrustedRuntime=require("./productionTrustedRuntime.js");

const PORT=Number.parseInt(process.env.PORT||"8080",10);
const MAX_BODY_BYTES=1024;
const provider=createFirebaseAdminProductionProvider();

function writeJson(response,status,payload,origin){
  const body=JSON.stringify(payload);
  const headers={
    "Content-Type":"application/json; charset=utf-8",
    "Content-Length":Buffer.byteLength(body),
    "Cache-Control":"no-store",
    "X-Content-Type-Options":"nosniff",
    "Referrer-Policy":"no-referrer"
  };
  if(origin===productionTrustedRuntime.allowedOrigin){
    headers["Access-Control-Allow-Origin"]=origin;
    headers["Vary"]="Origin";
  }
  response.writeHead(status,headers);
  response.end(body);
}

function boundedStatus(result){
  if(result&&result.ok===true)return result.action==="created"?201:200;
  const code=result&&typeof result.code==="string"?result.code:"";
  if(/TOKEN_REQUIRED|BEARER_TOKEN_REQUIRED|UNAUTHENTICATED|VERIFICATION_FAILED|TOKEN_REVOKED|TOKEN_EXPIRED|INVALID_PROVIDER_TOKEN/.test(code))return 401;
  if(/ORIGIN_FORBIDDEN|APP_MISMATCH|PROJECT_MISMATCH|AUTHORIZATION|ACCOUNT_DISABLED/.test(code))return 403;
  if(/UNAVAILABLE|TRANSACTION_FAILED|PROVIDER/.test(code))return 503;
  return 400;
}

function readEmptyJsonBody(request){
  return new Promise((resolve,reject)=>{
    let size=0;
    let raw="";
    request.setEncoding("utf8");
    request.on("data",chunk=>{
      size+=Buffer.byteLength(chunk);
      if(size>MAX_BODY_BYTES){
        reject(new Error("REQUEST_BODY_TOO_LARGE"));
        request.destroy();
        return;
      }
      raw+=chunk;
    });
    request.on("end",()=>{
      if(!raw.trim())return resolve({});
      let parsed;
      try{parsed=JSON.parse(raw);}catch(_error){return reject(new Error("REQUEST_BODY_INVALID_JSON"));}
      if(!parsed||typeof parsed!=="object"||Array.isArray(parsed)||Object.keys(parsed).length!==0){
        return reject(new Error("REQUEST_BODY_FIELDS_FORBIDDEN"));
      }
      resolve(parsed);
    });
    request.on("error",reject);
  });
}

const server=http.createServer(async(request,response)=>{
  const origin=typeof request.headers.origin==="string"?request.headers.origin:"";

  if(request.method==="GET"&&request.url==="/healthz"){
    return writeJson(response,200,{ok:true,service:"career-mode-showdown-trusted-runtime"},null);
  }

  if(request.url!=="/v1/account/bootstrap"){
    return writeJson(response,404,{ok:false,code:"NOT_FOUND"},origin);
  }

  if(request.method!=="POST"&&request.method!=="OPTIONS"){
    return writeJson(response,405,{ok:false,code:"METHOD_NOT_ALLOWED"},origin);
  }

  if(request.method==="POST"){
    try{await readEmptyJsonBody(request);}catch(error){
      return writeJson(response,400,{ok:false,code:error&&error.message?error.message:"REQUEST_BODY_INVALID"},origin);
    }
  }

  let result;
  try{
    result=await productionTrustedRuntime.executeProductionTrustedRequest({
      method:request.method,
      origin,
      url:request.url,
      headers:request.headers,
      provider
    });
  }catch(_error){
    result={ok:false,code:"PRODUCTION_TRUSTED_RUNTIME_INTERNAL_FAILURE"};
  }

  if(result&&result.ok===true&&result.action==="preflight"){
    response.writeHead(204,{
      "Access-Control-Allow-Origin":productionTrustedRuntime.allowedOrigin,
      "Access-Control-Allow-Methods":"POST, OPTIONS",
      "Access-Control-Allow-Headers":"Authorization, Content-Type, X-Firebase-AppCheck",
      "Access-Control-Max-Age":"600",
      "Cache-Control":"no-store",
      "Vary":"Origin"
    });
    return response.end();
  }

  return writeJson(response,boundedStatus(result),result,origin);
});

server.listen(PORT,"0.0.0.0",()=>{
  process.stdout.write(`career-mode-showdown trusted runtime listening on ${PORT}\n`);
});
