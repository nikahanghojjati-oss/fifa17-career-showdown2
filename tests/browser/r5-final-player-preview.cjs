const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { resolveChromiumRuntime } = require('../support/chromium-runtime.cjs');

const baseUrl = new URL(process.env.CMS_BASE_URL || 'http://127.0.0.1:4173/');
const resultsDirectory = path.resolve(process.env.CMS_TEST_RESULTS || 'test-results');
const requested = process.env.CMS_PREVIEW_CASE || 'desktop';
const cases = {
  desktop: { viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1 },
  windowed: { viewport: { width: 940, height: 700 }, deviceScaleFactor: 1 },
  mobile: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
};
const testCase = cases[requested];
if (!testCase) throw new Error(`Unknown preview case: ${requested}`);
fs.mkdirSync(resultsDirectory, { recursive: true });

async function waitForApp(page) {
  await page.goto(baseUrl.href, { waitUntil: 'domcontentloaded' });
  await page.locator('#loadingScreen').waitFor({ state: 'hidden', timeout: 12000 });
  await page.locator('#mainMenu').waitFor({ state: 'visible', timeout: 5000 });
  await page.waitForFunction(() => {
    if (typeof window.getFootballVisualDiagnostics !== 'function') return false;
    const state = window.getFootballVisualDiagnostics();
    return state.initialized && state.assetCount === 5 && state.preloadCount === 5;
  }, null, { timeout: 15000 });
}

async function waitForVisual(page, screenName, count) {
  await page.waitForFunction(({ screenName, count }) => {
    const root = document.querySelector(`[data-football-visual-screen="${screenName}"]`);
    if (!root) return false;
    const panels = root.classList.contains('footballVisualPanel') ? [root] : [...root.querySelectorAll('.footballVisualPanel')];
    return panels.length === count && panels.every(panel => {
      const image = panel.querySelector('.footballVisualMedia');
      return panel.classList.contains('imageLoaded') && image && image.complete && image.naturalWidth > 0;
    });
  }, { screenName, count }, { timeout: 12000 });
}

async function inspect(page, screenName, count) {
  const rows = await page.evaluate(({ screenName }) => {
    const root = document.querySelector(`[data-football-visual-screen="${screenName}"]`);
    const panels = root.classList.contains('footballVisualPanel') ? [root] : [...root.querySelectorAll('.footballVisualPanel')];
    return panels.map(panel => {
      const image = panel.querySelector('.footballVisualMedia');
      const frame = panel.querySelector('.footballVisualMediaFrame');
      const style = getComputedStyle(image);
      const imageRect = image.getBoundingClientRect();
      const frameRect = frame.getBoundingClientRect();
      return {
        id: panel.dataset.footballVisualAsset,
        fit: style.objectFit,
        opacity: Number(style.opacity),
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
        imageWidth: imageRect.width,
        imageHeight: imageRect.height,
        frameWidth: frameRect.width,
        frameHeight: frameRect.height
      };
    });
  }, { screenName });
  assert.equal(rows.length, count);
  for (const row of rows) {
    assert.equal(row.fit, 'contain', `${row.id}: runtime must retain authored crop with contain`);
    assert.ok(row.opacity >= .99, `${row.id}: must be fully opaque`);
  }
  return rows;
}

async function showCreate(page) {
  await page.locator('#newShowdown').click();
  await page.locator('#createShowdown').waitFor({ state: 'visible', timeout: 5000 });
  await waitForVisual(page, 'createShowdown', 1);
  return inspect(page, 'createShowdown', 1);
}

async function showTransfer(page) {
  const result = await page.evaluate(async () => {
    if (typeof window.ensureGameplayModules === 'function') await window.ensureGameplayModules();
    if (typeof initializeTransferChallenge === 'function') initializeTransferChallenge();
    const now = new Date().toISOString();
    currentShowdown = normalizeShowdown({
      schemaVersion: 2,
      id: 1700000000000,
      name: 'R5 Final Player Preview',
      managers: { playerOne: 'Manager One', playerTwo: 'Manager Two' },
      totalRounds: 1,
      currentRound: 1,
      status: 'Ready',
      selectedLeague: { id: 'premier_league', name: 'Premier League', country: 'England', logo: 'assets/logos/premierleague.png' },
      clubs: { playerOne: 'Manchester United', playerTwo: 'Chelsea' },
      score: { playerOne: 0, playerTwo: 0 },
      transferChallenges: [], rounds: [], integrityWarnings: [],
      createdAt: now, updatedAt: now, completedAt: null, archivedAt: null
    });
    saveCurrentShowdown();
    openTransferChallenge();
    return typeof getActiveScreenName === 'function' ? getActiveScreenName() : null;
  });
  assert.equal(result, 'transferChallenge');
  await page.locator('#transferChallenge').waitFor({ state: 'visible', timeout: 5000 });
  await waitForVisual(page, 'transferChallenge', 2);
  return inspect(page, 'transferChallenge', 2);
}

(async () => {
  const runtime = await resolveChromiumRuntime();
  const browser = await chromium.launch({ executablePath: runtime.executablePath, args: runtime.args, headless: true });
  try {
    const context = await browser.newContext({
      viewport: testCase.viewport,
      deviceScaleFactor: testCase.deviceScaleFactor,
      isMobile: Boolean(testCase.isMobile),
      hasTouch: Boolean(testCase.hasTouch),
      reducedMotion: 'reduce'
    });
    const page = await context.newPage();
    await waitForApp(page);
    const create = await showCreate(page);
    await page.locator('#createShowdown').screenshot({ path: path.join(resultsDirectory, `r5-final-james-${requested}.png`) });
    const transfer = await showTransfer(page);
    await page.locator('#transferChallenge').screenshot({ path: path.join(resultsDirectory, `r5-final-rashford-martial-${requested}.png`) });
    fs.writeFileSync(path.join(resultsDirectory, `r5-final-player-metrics-${requested}.json`), JSON.stringify({ requested, create, transfer }, null, 2));
    await context.close();
  } finally {
    await browser.close();
  }
  console.log(`R5 final player preview passed for ${requested}.`);
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
