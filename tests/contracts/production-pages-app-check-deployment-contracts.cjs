const assert=require("node:assert/strict");
const fs=require("node:fs");
const os=require("node:os");
const path=require("node:path");
const {spawnSync}=require("node:child_process");

const read=file=>fs.readFileSync(file,"utf8");
const workflow=read(".github/workflows/deploy-github-pages.yml");
const placeholderSource=read("firebase.runtime-config.json");
const placeholder=JSON.parse(placeholderSource);
const rendererSource=read("scripts/render-production-firebase-public-config.mjs");

assert.match(workflow,/name:\s*Deploy GitHub Pages/);
assert.match(workflow,/push:\s*\n\s*branches:\s*\[main\]/);
assert.match(workflow,/workflow_dispatch:/);
assert.match(workflow,/permissions:\s*\n\s*contents:\s*read\s*\n\s*pages:\s*write\s*\n\s*id-token:\s*write/);
assert.match(workflow,/group:\s*pages-production/);
assert.match(workflow,/cancel-in-progress:\s*false/);

assert.match(workflow,/vars\.CMS_FIREBASE_WEB_API_KEY/);
assert.match(workflow,/vars\.CMS_RECAPTCHA_ENTERPRISE_SITE_KEY/);
assert.doesNotMatch(workflow,/secrets\.CMS_FIREBASE_WEB_API_KEY|secrets\.CMS_RECAPTCHA_ENTERPRISE_SITE_KEY/);
assert.match(workflow,/Required GitHub Actions variables CMS_FIREBASE_WEB_API_KEY and CMS_RECAPTCHA_ENTERPRISE_SITE_KEY are not configured/);
assert.doesNotMatch(workflow,/echo[^\n]*(?:firebaseConfig\.apiKey|recaptchaEnterpriseSiteKey|\$\{\{\s*vars\.CMS_)/i,"Workflow must never print provider values.");

assert.match(workflow,/actions\/configure-pages@v5/);
assert.match(workflow,/actions\/upload-pages-artifact@v4/);
assert.match(workflow,/actions\/deploy-pages@v4/);
assert.match(workflow,/environment:\s*\n\s*name:\s*github-pages/);
assert.match(workflow,/node-version:\s*24/);
assert.match(workflow,/cp index\.html manifest\.webmanifest service-worker\.js firebase\.runtime-config\.json \.pages-artifact\//);
assert.match(workflow,/cp -R acceptance assets css data js \.pages-artifact\//);
assert.match(workflow,/node \.pages-artifact\/scripts\/render-production-firebase-public-config\.mjs/);
assert.match(workflow,/rm -rf \.pages-artifact\/scripts/);
assert.doesNotMatch(workflow,/firebase\s+deploy|firebase-hosting|Firebase Hosting/i,"Pages deployment must not introduce Firebase Hosting.");
assert.doesNotMatch(workflow,/git\s+(?:add|commit|push)/,"Deployment must never write generated provider configuration back to repository history.");

assert.equal(placeholder.schemaVersion,1);
assert.equal(placeholder.configured,false);
assert.equal(Object.hasOwn(placeholder.firebaseConfig,"apiKey"),false);
assert.equal(placeholder.recaptchaEnterpriseSiteKey,"");
assert.doesNotMatch(placeholderSource,/AIza[0-9A-Za-z_-]{35}/);
assert.match(rendererSource,/process\.env\.CMS_FIREBASE_WEB_API_KEY/);
assert.match(rendererSource,/process\.env\.CMS_RECAPTCHA_ENTERPRISE_SITE_KEY/);

const tempRoot=fs.mkdtempSync(path.join(os.tmpdir(),"cms-pages-app-check-"));
const tempScripts=path.join(tempRoot,"scripts");
fs.mkdirSync(tempScripts,{recursive:true});
fs.copyFileSync("scripts/render-production-firebase-public-config.mjs",path.join(tempScripts,"render-production-firebase-public-config.mjs"));
const fakeApiKey=`AIza${"A".repeat(35)}`;
const fakeSiteKey="synthetic-recaptcha-enterprise-site-key-for-contract";
const result=spawnSync(process.execPath,[path.join(tempScripts,"render-production-firebase-public-config.mjs")],{
  cwd:tempRoot,
  encoding:"utf8",
  env:{...process.env,CMS_FIREBASE_WEB_API_KEY:fakeApiKey,CMS_RECAPTCHA_ENTERPRISE_SITE_KEY:fakeSiteKey}
});
try{
  assert.equal(result.status,0,result.stderr||result.stdout);
  assert.doesNotMatch(result.stdout,new RegExp(fakeApiKey));
  assert.doesNotMatch(result.stdout,new RegExp(fakeSiteKey));
  const rendered=JSON.parse(fs.readFileSync(path.join(tempRoot,"firebase.runtime-config.json"),"utf8"));
  assert.equal(rendered.schemaVersion,1);
  assert.equal(rendered.configured,true);
  assert.equal(rendered.firebaseConfig.projectId,"fifa17-career-showdown-prod");
  assert.equal(rendered.firebaseConfig.apiKey,fakeApiKey);
  assert.equal(rendered.recaptchaEnterpriseSiteKey,fakeSiteKey);
}finally{
  fs.rmSync(tempRoot,{recursive:true,force:true});
}

process.stdout.write("PASS production Pages deployment renders App Check browser-public config only into the deployment artifact, fails closed without controlled variables, stages the bounded SSJR acceptance observer, and never commits or logs provider values\n");
