const assert=require("node:assert/strict");
const fs=require("node:fs");
const os=require("node:os");
const path=require("node:path");
const {spawnSync}=require("node:child_process");
const workflow=fs.readFileSync(".github/workflows/deploy-github-pages.yml","utf8");
const placeholder=JSON.parse(fs.readFileSync("firebase.runtime-config.json","utf8"));
const rendererSource=fs.readFileSync("scripts/render-production-firebase-public-config.mjs","utf8");
assert.match(workflow,/vars\.CMS_FIREBASE_WEB_API_KEY/);
assert.doesNotMatch(workflow,/CMS_RECAPTCHA_ENTERPRISE_SITE_KEY/);
assert.match(workflow,/Required GitHub Actions variable CMS_FIREBASE_WEB_API_KEY is not configured/);
assert.doesNotMatch(rendererSource,/CMS_RECAPTCHA_ENTERPRISE_SITE_KEY|recaptchaEnterpriseSiteKey/);
assert.equal(placeholder.recaptchaEnterpriseSiteKey,undefined);
const tempRoot=fs.mkdtempSync(path.join(os.tmpdir(),"cms-pages-firebase-"));
const tempScripts=path.join(tempRoot,"scripts");fs.mkdirSync(tempScripts,{recursive:true});
fs.copyFileSync("scripts/render-production-firebase-public-config.mjs",path.join(tempScripts,"render-production-firebase-public-config.mjs"));
const fakeApiKey=`AIza${"A".repeat(35)}`;
const result=spawnSync(process.execPath,[path.join(tempScripts,"render-production-firebase-public-config.mjs")],{cwd:tempRoot,encoding:"utf8",env:{...process.env,CMS_FIREBASE_WEB_API_KEY:fakeApiKey}});
try{
  assert.equal(result.status,0,result.stderr||result.stdout);
  assert.doesNotMatch(result.stdout,new RegExp(fakeApiKey));
  const rendered=JSON.parse(fs.readFileSync(path.join(tempRoot,"firebase.runtime-config.json"),"utf8"));
  assert.equal(rendered.configured,true);
  assert.equal(rendered.firebaseConfig.projectId,"fifa17-career-showdown-prod");
  assert.equal(rendered.firebaseConfig.apiKey,fakeApiKey);
  assert.equal(rendered.recaptchaEnterpriseSiteKey,undefined);
}finally{fs.rmSync(tempRoot,{recursive:true,force:true});}
console.log("PASS production Pages deployment renders Firebase public config with no reCAPTCHA/App Check variable or runtime field.");
