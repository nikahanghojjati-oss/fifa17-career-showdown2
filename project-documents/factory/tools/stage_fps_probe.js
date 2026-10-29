// HO-002 stage fps probe (V-244). usage: NODE_PATH=$(npm root -g) SETTLE=7000 node stage_fps_probe.js http://localhost:PORT settings label
// Serves the whole site; opens a v10 route; measures idle fps over 5 s, mouse-move round trips and fps during a 3 s mouse sweep.
const { chromium } = require('playwright');
(async () => {
  const [base, key, label] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(base + '/index.html', { waitUntil: 'load' });
  await p.waitForTimeout(6000);
  await p.evaluate(k => window.CareerModeV10Screens.navigate(k), key).catch(e => errs.push('nav ' + e));
  await p.waitForTimeout(4000);
  const info = await p.evaluate(() => ({
    stages: document.querySelectorAll('.sd-stage').length,
    visibleStage: [...document.querySelectorAll('.sd-stage')].some(s => s.offsetParent !== null),
    running: document.getAnimations().filter(a => a.playState === 'running').length,
  }));
  // idle fps 5 s (wait 10 s more first so a one-shot intro has finished)
  if (process.env.SETTLE) await p.waitForTimeout(Number(process.env.SETTLE));
  const idle = await p.evaluate(() => new Promise(r => { let n = 0; const t0 = performance.now(); const f = t => { n++; if (t - t0 < 5000) requestAnimationFrame(f); else r({ fps: n / ((t - t0) / 1000), running: document.getAnimations().filter(a => a.playState === 'running').length }); }; requestAnimationFrame(f); }));
  // mouse moves: 40 moves, time each round-trip to next frame
  const moves = [];
  for (let i = 0; i < 40; i++) {
    const t0 = Date.now();
    await p.mouse.move(400 + i * 25, 300 + (i % 5) * 40);
    await p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    moves.push(Date.now() - t0);
  }
  moves.sort((a, b) => a - b);
  // fps while the mouse sweeps for 3 s (a move every 16 ms)
  const sweepP = p.evaluate(() => new Promise(r => { let n = 0; const t0 = performance.now(); const f = t => { n++; if (t - t0 < 3000) requestAnimationFrame(f); else r(n / ((t - t0) / 1000)); }; requestAnimationFrame(f); }));
  const tEnd = Date.now() + 3000; let i = 0;
  while (Date.now() < tEnd) { await p.mouse.move(300 + (i * 37) % 1300, 200 + (i * 23) % 700); i++; await new Promise(r => setTimeout(r, 16)); }
  const sweepFps = await sweepP;
  const runningNames = await p.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').map(a => (a.animationName || a.constructor.name) + '@' + (a.effect.target && a.effect.target.className)).slice(0, 4));
  console.log(JSON.stringify({ label, key, ...info, idleFps: +idle.fps.toFixed(1), runningIdle: idle.running, moveMedianMs: moves[20], moveP90Ms: moves[36], sweepFps: +sweepFps.toFixed(1), moves: i, runningNames, errs: errs.slice(0, 3) }));
  if (process.env.SHOT) await p.screenshot({ path: process.env.SHOT });
  await b.close();
})();
