const fs=require('node:fs');
const path=require('node:path');
const file=path.resolve(__dirname,'..','SESSION_BOOTSTRAP.json');
const bootstrap=JSON.parse(fs.readFileSync(file,'utf8'));
bootstrap.currentLane='PR #176 Stage 5D at fixed RJR87 established repository Rules blob 363af783d7e5436fdfaa3766d4aa413fc9952a08 while the prior provider-proven source was 2b7c0b166ae0aae7ab7a3ce84725b21091262484; that zero-billing provider publication boundary is preserved as consumed provenance before the separate runtime host/join UX milestone. Current Stage 5E source candidate is v1.9.0 / 1.9.0-r1 under exact-head validation; production remains 1.8.1-r5 until merge/deploy and RJR remains 87 until genuine two-account/two-device evidence.';
fs.writeFileSync(file,JSON.stringify(bootstrap,null,2)+'\n');
fs.unlinkSync(__filename);
