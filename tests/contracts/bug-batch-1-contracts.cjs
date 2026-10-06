const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {webcrypto}=require("node:crypto");

// Bug batch 1 (r62): plain-language player errors, neutral manager fallbacks, 80-character signing names.
const root=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const R="pair_"+"7".repeat(64),S="session_"+"6".repeat(64),D="device_"+"1".repeat(32),U="account_one";
const RAW_CODE=/[A-Z]{3,}(?:[_ ][A-Z]{2,})+/;

function setupSandbox(mutate){
  const sandbox={console,crypto:webcrypto,setTimeout,clearTimeout,Promise};sandbox.globalThis=sandbox;
  sandbox.CareerModeProductionFirebaseRuntime={ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:U}},firestore:{},firestoreSdk:{}})};
  sandbox.CareerModeSparkConnectedAccount={initialize:async()=>true,getState:()=>({connected:true,accountId:U})};
  sandbox.CareerModeSparkPrivatePairing={initialize:async()=>true,getState:()=>({registered:true,deviceId:D})};
  sandbox.CareerModeSparkConnectedRivalry={initialize:async()=>true,getState:()=>({attached:true,rivalryId:R,binding:{managerRole:"playerOne"},accountId:U,deviceId:D})};
  sandbox.CareerModeSparkRemoteJoining={getState:()=>({sessionState:"active",sessionId:S,expiresAtEpochMs:Date.now()+3_600_000,rivalryId:R,accountId:U,deviceId:D,role:"host",pendingAction:null})};
  sandbox.CareerModeSharedShowdownSetup={};sandbox.CareerModeSharedShowdownCatalog={catalog:{}};
  sandbox.CareerModeSparkSharedShowdownSetup={read:async()=>({ok:true,status:"empty",revision:0,state:null}),mutate};
  sandbox.CareerModeProductionSharedJourneyConflicts={execute:async(_intent,write)=>write()};
  vm.createContext(sandbox);
  vm.runInContext(read("js/productionSharedShowdownSetup.js"),sandbox,{filename:"productionSharedShowdownSetup.js"});
  return sandbox.CareerModeProductionSharedShowdownSetup;
}

(async()=>{
  // BUG-1: stale/revision race that survives the one retry reads as a plain sentence; the code is kept for diagnostics only.
  let api=setupSandbox(async()=>({ok:false,code:"SETUP_STALE_BASE_REVISION"}));
  await api.refresh();
  let result=await api.mutate("open");
  assert.equal(result.ok,false);assert.equal(result.code,"SETUP_STALE_BASE_REVISION","the code stays on the result for diagnostics");
  let state=api.getState();
  assert.equal(state.status,"error");
  assert.equal(state.message,"Your partner just changed this. It's been refreshed, tap again.");
  assert.equal(state.errorCode,"SETUP_STALE_BASE_REVISION");
  assert.doesNotMatch(state.message,RAW_CODE,"the visible Setup sentence must not contain a raw code");

  // Permission / network failures read as a connection sentence.
  api=setupSandbox(async()=>{const error=new Error("permission-denied");error.code="permission-denied";throw error;});
  await api.refresh();result=await api.mutate("open");state=api.getState();
  assert.equal(state.message,"That didn't go through. Check your connection and tap again.");assert.equal(state.errorCode,"permission-denied");

  // Unknown code falls back to the generic sentence.
  api=setupSandbox(async()=>({ok:false,code:"SOMETHING_NEW_AND_ODD"}));
  await api.refresh();result=await api.mutate("open");state=api.getState();
  assert.equal(state.message,"That didn't go through. Tap again.");assert.equal(result.code,"SOMETHING_NEW_AND_ODD");

  // A real human message wins over any mapping and over the code.
  api=setupSandbox(async()=>{const error=new Error("Only the host can open this right now.");error.code="SETUP_STALE_BASE_REVISION";throw error;});
  await api.refresh();result=await api.mutate("open");state=api.getState();
  assert.equal(state.message,"Only the host can open this right now.");assert.equal(result.message,"Only the host can open this right now.");

  // A message that merely repeats the code, or is a technical code-like string, is not a human message.
  const d=api.describeFailure;
  assert.equal(d(new Error("SETUP_STALE_BASE_REVISION")).kind,"generic");
  assert.equal(d(Object.assign(new Error("SETUP_STALE_BASE_REVISION"),{code:"SETUP_STALE_BASE_REVISION"})).kind,"stale");
  assert.equal(d({code:"SETUP_ALREADY_CONFIRMED"}).kind,"stale");
  assert.equal(d({code:"x",message:"Firebase: Error (auth/network-request-failed)."}).kind,"generic");
  assert.equal(d({code:"firestore/unavailable"}).kind,"connection");
  assert.equal(d({code:"SETUP_STALE_BASE_REVISION"}).tapDetail,"Your partner just changed this. It's been refreshed, tap again.");
  assert.equal(d({code:"nope"}).tapDetail,"Tap again.");

  // The locked path (line 163) also never shows a raw code.
  const setupSource=read("js/productionSharedShowdownSetup.js");
  assert.doesNotMatch(setupSource,/safeError\(error,"[A-Z_]+"\)\)\.replace\(\/_\/g/,"no visible Setup text may be a code with underscores replaced");

  // Presentation: the tap-failure sentence delegates to the plain-language mapper and keeps the code in a data attribute.
  const presentation=read("js/productionSharedShowdownPresentation.js");
  assert.doesNotMatch(presentation,/lastMutationCode[^;]*\.replace\(\/_\/g/,"the tap failure must not print the mutation code");
  assert.match(presentation,/THAT TAP DID NOT GO THROUGH · \$\{failure\.tapDetail\}/);
  assert.match(presentation,/setupApi\.describeFailure\(/);
  assert.match(presentation,/data-failure-code/);
  assert.doesNotMatch(presentation,/TAP AGAIN`/,"no raw code and no trailing code sentence");
  // The code may follow the plain sentence only as a "Ref" detail (POS10 proof SHARED_POLISHED_PRESENTATION_BROWSER requires it visible).
  assert.match(presentation,/\$\{tapFailure\}\$\{tapFailureCode\?` · Ref \$\{ssjpFailureRef\(tapFailureCode\)\}`:""\}/,"the code shows only after the plain sentence, as Ref");
  assert.equal((presentation.match(/ssjpFailureRef\(/g)||[]).length,2,"Ref is defined once and used only for the tap-failure detail");

  // No other visible `.replace(/_/g," ")` of an error code in the shared production modules.
  for(const file of fs.readdirSync(path.join(root,"js")).filter(name=>/^productionShared.*\.js$/.test(name))){
    for(const line of read(`js/${file}`).split("\n")){
      if(/\.replace\(\/_\/g,\s*" "\)/.test(line))assert.doesNotMatch(line,/(error|Code|\.code)/,`${file} must not print an error code as text: ${line.slice(0,140)}`);
    }
  }

  // BUG-2: neutral fallbacks, no hard-coded Daniel/Nik.
  const progression=read("js/productionSharedMultiSeasonProgression.js");
  assert.match(progression,/role==="playerOne"\?"Manager 1":"Manager 2"/);
  assert.match(progression,/pmspShowdown\(\)\?\.name\|\|"Showdown"/);
  assert.doesNotMatch(progression.replace(/\/\/.*$/gm,""),/Daniel|"Nik"|Nik\b/,"no hard-coded manager names in the progression module");

  // BUG-3: signing name inputs are capped at the provider limit (80), and the visible transfer error shows message before code.
  const transfer=read("js/productionSharedTransferChallenge.js");
  const provider=read("js/sharedTransferChallenge.js");
  assert.match(provider,/name\.length>80/,"provider limit is 80 characters");
  assert.match(transfer,/const SIGNING_NAME_MAX=80;/);
  const grab=name=>{const match=transfer.match(new RegExp(`  (?:const ${name}=|function ${name}\\()[^\\n]*`));assert.ok(match,name);return match[0];};
  const inputs=new Map();
  const sandbox={document:{getElementById:id=>/^p[12]Signing[123]Name$/.test(id)?(inputs.get(id)||inputs.set(id,{attrs:{},getAttribute(k){return this.attrs[k]??null;},setAttribute(k,v){this.attrs[k]=String(v);}}).get(id)):null}};
  sandbox.root=sandbox;
  vm.createContext(sandbox);
  vm.runInContext(`${grab("SIGNING_NAME_MAX")}\n${grab("PLAIN_PROVIDER_CODES")}\nfunction pstcField(id){return root.document&&root.document.getElementById(id);}\n${grab("pstcCapSigningNames")}\n${grab("pstcErrorText")}\nthis.cap=pstcCapSigningNames;this.text=pstcErrorText;`,sandbox);
  sandbox.cap();
  assert.equal(inputs.size,6,"all six signing name inputs are capped");
  for(const input of inputs.values())assert.equal(input.getAttribute("maxlength"),"80");
  assert.match(transfer,/function pstcRender\(\)\{\s*if\(!root\.document\|\|!pstcSharedMarker\(\)\)return false;\s*pstcCapSigningNames\(\);/,"the cap is applied on every render");
  assert.equal(sandbox.text(Object.assign(new Error("Complete signing 1 with player name, previous league and nationality."),{code:"TRANSFER_SIGNINGS_INVALID"}),"x"),"Complete signing 1 with player name, previous league and nationality.","error.message comes before error.code");
  const providerRejected=Object.assign(new Error("The shared Transfer Challenge request was rejected."),{code:"TRANSFER_SIGNINGS_INVALID",providerResult:true});
  const shown=sandbox.text(providerRejected,"x");
  assert.doesNotMatch(shown,/TRANSFER_SIGNINGS_INVALID/,"a provider signings rejection is no longer a bare code");
  assert.match(shown,/80 characters/);
  assert.equal(sandbox.text(Object.assign(new Error("TRANSFER_X"),{code:"TRANSFER_X",providerResult:true}),"x"),"TRANSFER_X","unmapped provider codes are unchanged");
  assert.equal(sandbox.text({},"fallback sentence"),"fallback sentence");

  console.log("PASS bug-batch-1 contracts: plain Setup/tap errors, neutral manager fallbacks, 80-character signing names.");
})().catch(error=>{console.error(error);process.exit(1);});
