import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const outputPath=path.join(root,"firebase.runtime-config.json");
const apiKey=(process.env.CMS_FIREBASE_WEB_API_KEY||"").trim();
const siteKey=(process.env.CMS_RECAPTCHA_ENTERPRISE_SITE_KEY||"").trim();

if(!apiKey)throw new Error("CMS_FIREBASE_WEB_API_KEY is required for production runtime config rendering.");
if(!siteKey)throw new Error("CMS_RECAPTCHA_ENTERPRISE_SITE_KEY is required for production runtime config rendering.");
if(!/^AIza[0-9A-Za-z_-]{35}$/.test(apiKey))throw new Error("CMS_FIREBASE_WEB_API_KEY does not match the expected Google API key shape.");
if(siteKey.length<20)throw new Error("CMS_RECAPTCHA_ENTERPRISE_SITE_KEY is unexpectedly short.");

const config={
  schemaVersion:1,
  configured:true,
  firebaseConfig:{
    apiKey,
    authDomain:"fifa17-career-showdown-prod.firebaseapp.com",
    projectId:"fifa17-career-showdown-prod",
    storageBucket:"fifa17-career-showdown-prod.firebasestorage.app",
    messagingSenderId:"409396353288",
    appId:"1:409396353288:web:1d3a2a5d6921de6ccbb4bd"
  },
  recaptchaEnterpriseSiteKey:siteKey
};

await fs.writeFile(outputPath,`${JSON.stringify(config,null,2)}\n`,`utf8`);
process.stdout.write("Rendered production Firebase public runtime configuration without printing provider-issued values.\n");
