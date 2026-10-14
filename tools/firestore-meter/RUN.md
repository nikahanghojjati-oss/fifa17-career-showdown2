Re-run (from scratchpad/readmeter):
 ln -s ../r65/node_modules ../cfix/node_modules
 (cd ../cfix && CMS_TEST_PORT=4521 node tests/support/static-server.cjs &)   # or point CMS_BASE_URL at any served tree
 CMS_APP_ROOT=<tree served>  CMS_BASE_URL=http://127.0.0.1:4521/ CMS_CHROMIUM_MULTI_CONTEXT=1 PARK_MS=60000 METER_OUT=out.json \
   npx --yes firebase-tools@15.28.1 emulators:exec --config firebase.meter.json --only auth,firestore --project demo-cms-browser-journey "node meter-journey.cjs"
 node report.js out.json ; node analyze.js out.json ; node perwin.js out.json <label-substring>
 Optional: STOP_AFTER=<park label>, PRESTART_MS=240000 (park on Transfer before Daniel starts).
 Pristine baseline tree: readmeter/base (git archive of 4cc023214), serve with CMS_TEST_PORT=4522 from inside base/.
