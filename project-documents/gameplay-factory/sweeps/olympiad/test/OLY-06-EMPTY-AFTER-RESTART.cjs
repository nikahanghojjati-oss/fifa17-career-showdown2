'use strict';
// node project-documents/gameplay-factory/sweeps/olympiad/test/OLY-06-EMPTY-AFTER-RESTART.cjs
// Add --browser to also check the actual local Chromium screen.
const assert = require('node:assert/strict');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '../../../../..');
const Career = require(path.join(ROOT, 'js/sharedCareerAnalytics.js'));
const Screens = require(path.join(ROOT, 'js/careerScreensV10.js'));
const History = require(path.join(ROOT, 'js/rivalryLegacyV10.js'));
const Closed = require(path.join(ROOT, 'js/sharedClosedShowdownAdapter.js'));
const rivalryId = 'pair_' + 'a'.repeat(64);
const input = Closed.buildClosedCareerInput({
  index: {status: 'ready', rivalryIds: [rivalryId]},
  reads: {[rivalryId]: {status: 'abandoned', rivalryId, managerRole: 'playerOne'}},
  current: {indexStatus: 'ready', showdowns: [], currentShowdownOnly: true}
});
const model = Career.buildCareerModel(input);
async function main() {
  assert.equal(model.status, 'ready');
  assert.deepEqual(model.coverage, {readable: 1, indexed: 1});
  assert.equal(model.managers.daniel.seasons, 0);
  assert.equal(model.managers.nik.seasons, 0);
  assert.equal(History.toV10Frame(model, 'legacy').status, 'empty');
  console.log('Readable Showdowns: 1 of 1. Counted seasons: 0. History: empty.');
  const frame = Screens.toV10Frame(model, 'careerStatistics');
  console.log('Expected Career Statistics: empty (no completed record yet).');
  console.log('Actual Career Statistics: ' + frame.status + '.');
  if (process.argv.includes('--browser')) {
    const {spawn} = require('node:child_process');
    const {chromium} = require(path.join(ROOT, 'node_modules/playwright'));
    const {resolveChromiumRuntime} = require(path.join(ROOT, 'tests/support/chromium-runtime.cjs'));
    const port = '4196';
    const server = spawn(process.execPath, [path.join(ROOT, 'tests/support/static-server.cjs')], {cwd: ROOT, env: {...process.env, CMS_TEST_PORT: port}, stdio: ['ignore','pipe','pipe']});
    let browser;
    try {
      await new Promise((resolve,reject) => {
        server.once('error', reject);
        server.once('exit', code => reject(new Error('Local server exited: ' + code)));
        server.stdout.once('data', resolve);
      });
      browser = await chromium.launch(await resolveChromiumRuntime());
      const page = await browser.newPage({viewport: {width: 1440, height: 1000}, reducedMotion: 'reduce'});
      await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
      await page.goto('http://127.0.0.1:' + port + '/', {waitUntil:'domcontentloaded'});
      await page.locator('#loadingScreen').waitFor({state:'hidden'});
      await page.evaluate(async model => {
        await ensureOptionalModule('careerStatistics');
        await loadRuntimeScript('area06-seam', 'js/careerScreenSeam.js', () => Boolean(window.CareerModeCareerScreenSeam));
        openCareerStatistics({model});
      }, model);
      await page.waitForFunction(() => window.__careerStatisticsReady === true && document.documentElement.dataset.v10Screen === 'careerStatistics');
      console.log('Chromium: ' + (await page.locator('#statePanel').innerText()).replace(/\s+/g, ' '));
      if (process.env.CMS_A06_SCREENSHOT) await page.screenshot({path:process.env.CMS_A06_SCREENSHOT});
    } finally {
      await browser?.close();
      server.kill('SIGTERM');
    }
  }
  assert.equal(frame.status, 'empty', 'A readable career with only an unfinished Showdown ended early has no counted seasons; it must not claim history is unavailable.');
}
main().catch(error => {console.error(error.message);process.exitCode = 1;});
