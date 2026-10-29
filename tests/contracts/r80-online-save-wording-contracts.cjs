"use strict";
// r80 wording sweep (R80_SAVE_PLAN section 5): a live Showdown is saved online and continues on any device, so no screen may
// say the career or save lives in "this browser", "this device", a "local copy", "browser storage" and the like. This contract
// reads every string literal in js/ (comments are skipped), index.html and the visual-assets strings.json files and refuses
// those phrases. Two kinds of wording are allowed, both listed exactly below:
//  - sign-in and device wording (registered device, FORGET THIS DEVICE, install/update support): about this device's sign-in,
//    not about where the save lives;
//  - files whose screens are about backup files or are never shown to players (backup/restore, the hidden Save Library editor,
//    the acceptance tools, a schema note that the app never loads).
// An allowlist entry that no longer matches anything fails too, so the list only ever gets smaller.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {execFileSync}=require("node:child_process");

const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
let passed=0;
function check(name,fn){fn();passed+=1;console.log(`ok ${passed} ${name}`);}

const BANNED=[
  /\bthis browser\b/i,/\bthis device\b/i,/\bthis phone\b/i,
  /\blocal cop(?:y|ies)\b/i,/\bbrowser storage\b/i,/\bbrowser data\b/i,
  /\blocal saves?\b/i,/\bsaved locally\b/i,/\bstored locally\b/i,/\blocal to this\b/i,
  /\blocal showdowns?\b/i,/\blocal career\b/i,/\blocal game\b/i,
  // r80 gallery sweep: the Season Results check, the History & Backup page, install notices and error messages.
  /\blocal reconciliation\b/i,/\blocal backup\b/i,/\blocal (?:legacy )?history\b/i,/\blocal (?:offline|shell|application|data|cleanup)\b/i,
  /\bblocks local\b/i,/\blocal-save\b/i,/\bsaved on\b/i
];

// Whole files, each with its reason. Nothing else is skipped.
const EXEMPT_FILES=Object.freeze({
  "js/restore.js":"backup-file restore: it really does replace this browser's data from a backup file",
  "js/restoreUI.js":"backup-file restore screen",
  "js/importAnalysis.js":"backup-file preview screen",
  "js/backup.js":"backup-file export",
  "js/saveLibraryUI.js":"the Save Library editor: hidden in the online product (checked below)",
  "js/cloudSyncRemoteContract.js":"schema notes; the app never loads this file (checked below)",
  "js/productionAuthorizationAcceptance.js":"acceptance tool (acceptance mode only)",
  "js/stage5fProductionAuthenticatedNegatives.js":"acceptance tool (acceptance mode only)",
  "js/ssjrPhysicalJourneyAcceptance.js":"acceptance tool (acceptance mode only)",
  "js/ssjrProductionAcceptanceRecorder.js":"acceptance tool (acceptance mode only)"
});

// Exact strings: sign-in, device registration, session presence, install/update support. Keyed by file.
const SIGN_IN_AND_DEVICE=Object.freeze({
  "js/appUpdateBootstrap.js":["This browser cannot use the update service. Return to the game and reload it."],
  "js/offlineApp.js":["INSTALLED ON THIS DEVICE","Career Mode Showdown is already installed on this device.","This browser does not support the application update service."],
  "js/careerStartMarker.js":["This browser is not ready yet."],
  "js/onlinePlayerIdentity.js":["Who you are on this device.","THIS DEVICE","This browser could not be prepared."],
  "js/persistentNikDanielPair.js":["This browser is not ready yet."," for this phone on Home, then join again.","CHOOSE DANIEL OR NIK FOR THIS DEVICE FIRST"],
  "js/productionSharedJourneyEntry.js":["THIS BROWSER"],
  "js/productionSharedJourneyReconnect.js":["NOT CONNECTED ON THIS PHONE · Reloading drops the connection. "],
  "js/productionSharedShowdownSetup.js":["Register this browser before Shared Setup."],
  "js/productionSharedTerminalClose.js":["This browser must remain an active registered device."],
  "js/sparkConnectedRivalry.js":["Private connected-rivalry pointer storage is unavailable in this browser.","This browser is not a registered private device.","Registered device identity does not match this browser.","Register this browser privately before using Connected Rivalry."],
  "js/sparkPrivatePairing.js":["Private pairing is available after your private account and this device are ready.","Private device identity storage is unavailable in this browser.","This browser is not registered to the signed-in private account.","Registered device identity does not match this browser."," for this phone on Home, then join again.","Registering this browser privately…","This browser is privately registered. Pairing only links the two manager identities; gameplay synchronization is still locked.","This browser could not be registered.","Sign in above to register this browser and use private pairing."],
  "js/sparkPrivateSession.js":["This browser is not a registered private device."],
  "js/sparkRemoteJoining.js":["This phone is not set up yet. Go Home, sign in again and choose Daniel or Nik, then try again.","Daniel and Nik are not connected on this phone yet. Go Home and tap CONTINUE CAREER first.","This phone is already in that private session."],
  "js/startJoinViewModel.js":["Forget this session code on this browser? Nothing online is changed."]
});

// String-literal text of a JS file: quoted strings and the text parts of template literals. Comments and regex literals are
// skipped, so a comment may still say "this device" about the code.
function jsStrings(src){
  const out=[];let i=0;const n=src.length;let prev="";const stack=[];
  const ident=c=>/[A-Za-z0-9_$]/.test(c);
  const regexMayStart=p=>p===""||/[(,=:[!&|?{};+\-*%<>~^]$/.test(p)||/^(return|typeof|case|in|of|delete|void|throw|new|else|do)$/.test(p);
  function quoted(q){let s="";i+=1;while(i<n&&src[i]!==q){if(src[i]==="\\"){s+=src[i+1]==="n"?"\n":src[i+1];i+=2;continue;}s+=src[i++];}i+=1;out.push(s);prev="x";}
  function template(){let s="";while(i<n){const c=src[i];if(c==="\\"){s+=src[i+1];i+=2;continue;}if(c==="`"){i+=1;out.push(s);prev="x";return;}if(c==="$"&&src[i+1]==="{"){out.push(s);i+=2;stack.push(0);prev="{";return;}s+=c;i+=1;}}
  while(i<n){const c=src[i];
    if(/\s/.test(c)){i+=1;continue;}
    if(c==="/"&&src[i+1]==="/"){while(i<n&&src[i]!=="\n")i+=1;continue;}
    if(c==="/"&&src[i+1]==="*"){const end=src.indexOf("*/",i+2);i=end<0?n:end+2;continue;}
    if(c==="'"||c==='"'){quoted(c);continue;}
    if(c==="`"){i+=1;template();continue;}
    if(c==="/"&&regexMayStart(prev)){i+=1;let cls=false;while(i<n&&src[i]!=="\n"){const d=src[i];if(d==="\\"){i+=2;continue;}if(d==="[")cls=true;else if(d==="]")cls=false;else if(d==="/"&&!cls)break;i+=1;}i+=1;while(i<n&&/[a-z]/i.test(src[i]))i+=1;prev="x";continue;}
    if(stack.length){if(c==="{")stack[stack.length-1]+=1;else if(c==="}"){if(stack[stack.length-1]===0){stack.pop();i+=1;template();continue;}stack[stack.length-1]-=1;}}
    if(ident(c)){let w="";while(i<n&&ident(src[i]))w+=src[i++];prev=w;continue;}
    prev=c;i+=1;}
  return out;
}
function jsonStrings(value,out=[]){if(typeof value==="string")out.push(value);else if(Array.isArray(value))value.forEach(v=>jsonStrings(v,out));else if(value&&typeof value==="object")Object.values(value).forEach(v=>jsonStrings(v,out));return out;}
const banned=text=>BANNED.find(re=>re.test(text))||null;
const tracked=pattern=>execFileSync("git",["ls-files",pattern],{cwd:ROOT,encoding:"utf8"}).split("\n").filter(Boolean);

check("W1 the extractor reads strings and skips comments and regex literals",()=>{
  const sample="// this device\nconst a=\"saved on this device\";/* browser storage */const r=/local copy/;const t=`x ${a?\"in this browser\":`local save`} y`;";
  assert.deepEqual(jsStrings(sample),["saved on this device","x ","in this browser","local save"," y"]);
});

const used=new Map();
check("W2 no string in js/ says the save lives in this browser or device (sign-in and device wording excepted)",()=>{
  const files=tracked("js/*.js");assert.ok(files.length>100,"js/ is read");
  const found=[];
  for(const file of files){
    if(Object.prototype.hasOwnProperty.call(EXEMPT_FILES,file))continue;
    const allowed=SIGN_IN_AND_DEVICE[file]||[];
    for(const text of jsStrings(read(file))){
      const hit=banned(text);if(!hit)continue;
      if(allowed.includes(text)){used.set(`${file}\u0000${text}`,true);continue;}
      found.push(`${file}: ${JSON.stringify(text.slice(0,160))} (${hit})`);
    }
  }
  assert.deepEqual(found,[],"say it plainly: the Showdown is saved online and continues on any device");
});

check("W3 every allowlisted string is still used, so the allowlist only shrinks",()=>{
  const stale=[];for(const [file,list] of Object.entries(SIGN_IN_AND_DEVICE))for(const text of list)if(!used.has(`${file}\u0000${text}`))stale.push(`${file}: ${text}`);
  assert.deepEqual(stale,[],"remove allowlist entries that no longer match");
  for(const file of Object.keys(EXEMPT_FILES))assert.ok(fs.existsSync(path.join(ROOT,file)),`${file} still exists`);
});

check("W4 index.html and the visual-assets strings.json files carry none of the phrases",()=>{
  const html=read("index.html").replace(/<!--[\s\S]*?-->/g,"");
  assert.equal(banned(html),null,"index.html");
  const strings=tracked("visual-assets/**/strings.json");assert.ok(strings.length>=2,"strings.json files are read");
  for(const file of strings)for(const text of jsonStrings(JSON.parse(read(file))))assert.equal(banned(text),null,`${file}: ${text}`);
});

check("W5 the exemptions hold: the Save Library editor is hidden in the online product and the schema notes are never loaded",()=>{
  const identity=read("js/onlinePlayerIdentity.js");
  assert.match(identity,/#saveLibraryProductPanel:not\(\[data-test-surface=\\"internal-audit\\"\]\)[^"]*\{display:none!important\}/,"the online product hides the Save Library editor");
  for(const file of ["index.html","service-worker.js",...tracked("js/*.js")])assert.ok(!read(file).includes("cloudSyncRemoteContract"),`${file} never loads js/cloudSyncRemoteContract.js`);
});

check("W6 the r80 wording: END, not delete; a live game continues; nothing claims a local copy",()=>{
  assert.match(read("js/showdownModes.js"),/const RULE="Finish or end the current Showdown before you unpair\.",/);
  assert.match(read("js/persistentNikDanielPair.js"),/"Finish or end the current Showdown before you unpair\."/);
  assert.match(read("js/careerStartMarker.js"),/"Finish or end the current Showdown before starting your real career\."/);
  for(const file of tracked("js/*.js"))assert.doesNotMatch(read(file),/Finish or delete the current Showdown/,file);
  const identity=read("js/onlinePlayerIdentity.js");
  assert.match(identity,/return\["LIVE","CONTINUE SHOWDOWN","Your Showdown is live\. Tap to continue\."\]/,"a live game reads as continuing on Home");
  assert.match(identity,/const nik=isNik\?nikHomeTile\(\):current\?\.status==="ready"\?liveHomeTile\(\)\|\|pairAgainTile\(\):null;/,"Daniel's tile too");
  const pair=read("js/persistentNikDanielPair.js");
  assert.match(pair,/PERSISTENT_PAIR_SHOWDOWN_NOT_LOADED/);assert.match(pair,/function pairHasExactShowdownShell\(/);
  assert.doesNotMatch(pair,/LOCAL_RECOVERY_REQUIRED|pairHasExactLocalRecoveryCopy/,"the old local-recovery names are gone");
  assert.match(read("js/whichShowdownIsLive.js"),/cachedShell:wslCachedShell/);
});

// r80 gallery (Season Results, History & Backup, install notice, error messages): the exact old strings, so none comes back.
const REMOVED=Object.freeze([
  "LOCAL RECONCILIATION",
  "PREVIEW LOCAL RECONCILIATION",
  "Compare the shared result with your saved Showdown without changing it.",
  "LOCAL BACKUP",
  "Download a checksum-protected local backup",
  "from local Legacy history.",
  "can reopen its verified local shell offline",
  "Career Mode Showdown is installed and ready for local offline use.",
  "The verified local application is kept separate from your saved Showdown data.",
  "No local data was changed.",
  "but local cleanup needs attention.",
  "Shared Showdown blocks local ",
  "no replacement session or local-save mutation will be generated",
  "Local gameplay remains unchanged.",
  "before opening local data tools."
]);
check("W7 r80 Season Results: the result check speaks of the shared result, and no removed local-era string comes back",()=>{
  const lr=read("js/productionSharedLocalReconciliation.js");
  assert.match(lr,/lrText\(ui\.heading,"DOUBLE-CHECK"\);/);
  assert.match(lr,/lrText\(ui\.summary,"Optional: compare the shared result with the Showdown copy in this app\. Nothing is changed\."\);/);
  assert.match(lr,/"CHECKING YOUR SAVE…":"PREVIEW RESULT"/);
  const legacy=read("js/legacy.js");
  assert.match(legacy,/backupTitle\.textContent = "BACKUP FILE";/);
  assert.match(legacy,/"Download a checksum-protected backup file before destructive maintenance\./);
  const shown=[];
  for(const file of [...tracked("js/*.js"),"index.html",...tracked("visual-assets/**/*.js"),...tracked("visual-assets/**/strings.json")]){
    const text=file.endsWith(".js")?jsStrings(read(file)).join("\n"):read(file);
    for(const old of REMOVED)if(text.includes(old))shown.push(`${file}: ${old}`);
  }
  assert.deepEqual(shown,[],"the r80 wording replaced these strings");
});

console.log(`PASS r80 online save wording contracts: ${passed} checks (no screen says the save lives in this browser or device; sign-in/device wording and backup-file screens listed exactly; END, not delete; no local reconciliation, local backup or other removed local-era string).`);
