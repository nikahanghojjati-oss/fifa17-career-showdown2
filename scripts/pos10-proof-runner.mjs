import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const graph = JSON.parse(fs.readFileSync(path.join(root,'POS10_IMPACT_GRAPH.json'),'utf8'));
const proofToBundle = new Map();
for(const [bundle,ids] of Object.entries(graph.proofBundles)) for(const id of ids) proofToBundle.set(id,bundle);
const groupFor = id => graph.proofBundleGroups[proofToBundle.get(id)];
const commands = {
  JS_SYNTAX: `node scripts/pos10-syntax.mjs`,
  STATIC_APP_RELEASE: `node tests/contracts/static-app-release-contracts.cjs`,
  SPARK_ACCOUNT_BOOTSTRAP_EMULATOR: `npm install --no-save --package-lock=false --ignore-scripts firebase@12.17.1 @firebase/rules-unit-testing@5.0.1 firebase-tools@15.27.0 && npx --no-install firebase emulators:exec --project demo-career-mode-showdown-phase1f --only firestore "node tests/firebase/spark-account-bootstrap-emulator.cjs"`,
  STAGE3_PRIVATE_PAIRING_BROWSER: `node tests/browser/stage3-private-pairing-audit.cjs`,
  PAIRING_FOUR_CODE_BROWSER: `node tests/browser/pairing-four-code-automation-audit.cjs`,
  STAGE5B_DEVICE_CREDENTIAL_BROWSER: `node tests/browser/stage5b-device-credential-audit.cjs`,
  SHARED_PAIRED_FIRST_BROWSER: `node tests/browser/shared-showdown-paired-first-entry-audit.cjs`,
  STAGE4_RECONCILIATION_BROWSER: `CMS_AUDIT_RUN="pos10-impact-remote" node tests/browser/stage4-remote-local-reconciliation-audit.cjs`,
  STAGE4_MUTATION_RATE_CONTRACT: `node tests/contracts/stage4-mutation-rate-limit-contracts.cjs`,
  STAGE5A_PRIVATE_SESSION_CONTRACT: `node tests/contracts/stage5a-private-session-contracts.cjs`,
  STAGE5B_DEVICE_CREDENTIAL_CONTRACT: `node tests/contracts/stage5b-device-credential-contracts.cjs`,
  STAGE3_PAIRING_EMULATOR: `npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-career-mode-showdown-stage3 "node tests/firebase/stage3-private-pairing-emulator.cjs"`,
  STAGE4_CONNECTED_EMULATOR: `npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-career-mode-showdown-stage4 "node tests/firebase/stage4-connected-rivalry-emulator.cjs"`,
  STAGE4_IDEMPOTENCY_EMULATOR: `npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-career-mode-showdown-stage4 "node tests/firebase/stage4-idempotency-replay-emulator.cjs"`,
  STAGE4_ABUSE_EMULATOR: `npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-career-mode-showdown-stage4 "node tests/firebase/stage4-abuse-hardening-emulator.cjs"`,
  STAGE4_MUTATION_RATE_EMULATOR: `npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-career-mode-showdown-stage4 "node tests/firebase/stage4-mutation-rate-limit-emulator.cjs"`,
  STAGE5A_SESSION_EMULATOR: `npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-career-mode-showdown-stage5a "node tests/firebase/stage5a-private-session-emulator.cjs"`,
  STAGE5B_CREDENTIAL_EMULATOR: `npx --yes firebase-tools@15.28.1 emulators:exec --only auth,firestore --project demo-career-mode-showdown-stage5b "node tests/firebase/stage5b-device-credential-emulator.cjs"`,
  STAGE5C_AUTH_SESSION_EMULATOR: `npx --yes firebase-tools@15.28.1 emulators:exec --only auth,firestore --project demo-career-mode-showdown-stage5c "node tests/firebase/stage5c-zero-billing-standard-auth-session-emulator.cjs"`,
  SHARED_SETUP_PROVIDER_EMULATOR: `npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-career-mode-showdown-shared-setup "node tests/firebase/shared-showdown-setup-provider-emulator.cjs"`,
  SHARED_SETUP_PROVIDER_SESSION_EMULATOR: `npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-career-mode-showdown-shared-setup "node tests/firebase/shared-showdown-setup-provider-session-emulator.cjs"`,
  BUILD_PRODUCTION_RULES: `node scripts/build-production-firestore-rules.mjs`,
  SHARED_SETUP_PRODUCTION_PROVIDER_EMULATOR: `npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-career-mode-showdown-shared-setup-production "node tests/firebase/shared-showdown-setup-production-provider-emulator.cjs"`,
  STAGE5F_ACCOUNT_CHOOSER_CONTRACT: `node tests/contracts/stage5f-account-chooser-contracts.cjs`,
  STAGE5F_AUTH_NEGATIVES_CONTRACT: `node tests/contracts/stage5f-authenticated-negatives-contracts.cjs`,
  BACKUP_BROWSER: `CMS_AUDIT_RUN="pos10-impact-storage" npm run test:backup-browser`,
  IMPORT_BROWSER: `CMS_AUDIT_RUN="pos10-impact-storage" npm run test:import-browser`,
  RESTORE_BROWSER: `CMS_AUDIT_RUN="pos10-impact-storage" npm run test:restore-browser`,
  MULTI_SAVE_BROWSER: `CMS_AUDIT_RUN="pos10-impact-storage" npm run test:multi-save-browser`,
  HOME_VISUAL: `CMS_AUDIT_RUN="pos10-impact-visual" npm run test:home-visual`,
  LOADING_VISUAL: `CMS_CHROMIUM_MULTI_CONTEXT=1 CMS_AUDIT_RUN="pos10-impact-visual" npm run test:loading-visual`,
  FOOTBALL_VISUAL: `CMS_AUDIT_RUN="pos10-impact-visual" npm run test:football-visual`,
  SHARED_POLISHED_PRESENTATION_BROWSER: `CMS_CHROMIUM_MULTI_CONTEXT=1 CMS_AUDIT_RUN="pos10-impact-visual" node tests/browser/shared-showdown-polished-presentation-audit.cjs`,
  RUNTIME_BOUNDARY_BROWSER: `CMS_AUDIT_RUN="pos10-impact-full" npm run test:runtime-boundary`,
  SAVE_LIBRARY_UI_BROWSER: `CMS_AUDIT_RUN="pos10-impact-full" node tests/browser/save-library-ui-audit.cjs`,
  MANAGER_IDENTITY_BROWSER: `CMS_AUDIT_RUN="pos10-impact-full" node tests/browser/manager-identity-linkage-audit.cjs`,
  IDENTITY_SAFE_ANALYTICS_BROWSER: `CMS_AUDIT_RUN="pos10-impact-full" node tests/browser/identity-safe-career-analytics-audit.cjs`,
  OFFLINE_BOUNDARY_BROWSER: `CMS_AUDIT_RUN="pos10-impact-full" node tests/browser/offline-boundary-audit.cjs`,
  OFFLINE_CACHE_LIFECYCLE_BROWSER: `CMS_CHROMIUM_MULTI_CONTEXT=1 CMS_AUDIT_RUN="pos10-impact-full" node tests/browser/offline-cache-lifecycle-v2-audit.cjs`,
  FULL_BROWSER_BUNDLE: `CMS_AUDIT_RUN="pos10-impact-full" npm run test:browser`
};

const serverGroups = new Set(['REMOTE','STORAGE','VISUAL','FULL']);
const delay = ms => new Promise(resolve=>setTimeout(resolve,ms));

function run(command,label){
  process.stdout.write(`RUN POS10 proof ${label}\n`);
  const result = spawnSync('bash',['-lc',command],{cwd:root,env:process.env,stdio:'inherit',timeout:30*60*1000});
  if(result.error) throw result.error;
  if(result.status !== 0) throw new Error(`Proof ${label} failed with exit ${result.status}.`);
}

function verifySource(id,meta){
  const absolute = path.join(root,meta.source);
  if(!fs.existsSync(absolute)) throw new Error(`Proof source missing for ${id}: ${meta.source}`);
  const hash = spawnSync('git',['hash-object',meta.source],{cwd:root,encoding:'utf8'});
  if(hash.status !== 0) throw new Error(`Unable to hash proof source ${meta.source}.`);
  const actual = hash.stdout.trim();
  if(actual !== meta.gitBlobSha) throw new Error(`Proof source drift for ${id}: expected ${meta.gitBlobSha}, got ${actual}.`);
}

async function main(){
  const args = process.argv.slice(2);
  let requested = [];
  let group = null;
  for(let i=0;i<args.length;i++){
    if(args[i] === '--proofs' && args[i+1]) requested.push(...args[++i].split(','));
    else if(args[i] === '--group' && args[i+1]) group = args[++i];
    else throw new Error(`Unknown argument: ${args[i]}`);
  }
  requested = [...new Set(requested.map(v=>v.trim()).filter(Boolean))];
  if(group && !Object.values(graph.proofBundleGroups).includes(group)) throw new Error(`Unknown POS10 proof group: ${group}`);
  const unknown = requested.filter(id=>!proofToBundle.has(id));
  if(unknown.length) throw new Error(`Unknown POS10 proof IDs: ${unknown.join(', ')}`);
  if(group) requested = requested.filter(id=>groupFor(id) === group);
  if(!requested.length){
    console.log(`PASS POS10 proof runner: no proofs selected${group ? ` for group ${group}` : ''}.`);
    return;
  }

  if(group === 'REMOTE'){
    run(`npm install --no-save --package-lock=false firebase@12.17.1 @firebase/rules-unit-testing@5.0.1 firebase-admin@14.2.0`,'REMOTE_DEPENDENCIES');
  }

  let server = null;
  let logFd = null;
  try{
    if(group && serverGroups.has(group)){
      logFd = fs.openSync(`/tmp/cms-pos10-${group.toLowerCase()}-server.log`,'w');
      server = spawn('npm',['run','serve:test'],{cwd:root,env:process.env,stdio:['ignore',logFd,logFd]});
      await delay(1000);
      if(server.exitCode !== null) throw new Error(`Test server exited early for group ${group}.`);
    }
    for(const id of requested){
      const meta = graph.proofSources[id];
      if(meta){
        verifySource(id,meta);
        run(`node tests/support/run-workflow-blocks.cjs --source ${JSON.stringify(meta.source)}`,id);
      }else{
        const command = commands[id];
        if(!command) throw new Error(`Builtin proof command missing: ${id}`);
        run(command,id);
      }
    }
  }finally{
    if(server && server.exitCode === null) server.kill('SIGTERM');
    if(logFd !== null) fs.closeSync(logFd);
  }
  console.log(`PASS POS10 proof group ${group || 'UNSCOPED'} (${requested.length} exact proof IDs).`);
}

main().catch(error=>{
  console.error(error.message);
  process.exitCode = 1;
});
