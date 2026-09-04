const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"../..");
const source=fs.readFileSync(path.join(root,"js/stage5fAcceptanceAccountChooser.js"),"utf8");
const html=fs.readFileSync(path.join(root,"production-authorization-acceptance.html"),"utf8");

assert.match(html,/js\/stage5fAcceptanceAccountChooser\.js/);
assert.match(html,/Stage 5F sign-in forces Google's account chooser/i);
assert.match(source,/GOOGLE_PROMPT="select_account"/);
assert.match(source,/provider\.setCustomParameters\(\{prompt:GOOGLE_PROMPT\}\)/);
assert.match(source,/signInWithPopup\(services\.auth,provider\)/);
assert.match(source,/browserSessionPersistence/);
assert.match(source,/popupOnly:true/);
assert.match(source,/extraScopesRequested:false/);
assert.match(source,/accountBootstrapAllowed:false/);
assert.match(source,/billingRequired:false/);
assert.match(source,/blazeRequired:false/);
assert.match(source,/cloudFunctionsRequired:false/);
assert.match(source,/cloudRunRequired:false/);
assert.doesNotMatch(source,/signInWithRedirect/);
assert.doesNotMatch(source,/addScope\s*\(/);
assert.doesNotMatch(source,/localStorage/);
assert.doesNotMatch(source,/CloudFunctions|CloudRun|functions\(/);

console.log("PASS Stage 5F account chooser: explicit Google select_account stays popup-only, scope-neutral, storage-neutral and zero-billing.");
