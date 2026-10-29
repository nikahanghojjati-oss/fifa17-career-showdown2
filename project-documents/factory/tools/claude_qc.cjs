// Claude intake renderer: NODE_PATH=$(npm root -g) node claude_qc.cjs '[["name","visual-assets/v10_1/home/index.html",1366,768]]' (repo served on :8765; shots go to /tmp/claude-0/qc/)
require('fs').mkdirSync('/tmp/claude-0/qc',{recursive:true});
const { chromium } = require('playwright');
const shots = JSON.parse(process.argv[2]);
(async () => {
  const b = await chromium.launch();
  for (const [name, url, w, h] of shots) {
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const errs = [];
    p.on('response', r => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url().replace('http://localhost:8765/', '')); });
    p.on('pageerror', e => errs.push('JS ' + e.message));
    await p.goto('http://localhost:8765/' + url, { waitUntil: 'networkidle' }).catch(e => errs.push('nav ' + e.message));
    await p.waitForTimeout(4000);
    const sc = await p.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.scrollHeight]);
    await p.screenshot({ path: `/tmp/claude-0/qc/${name}.jpg`, quality: 72 });
    console.log(name, w + 'x' + h, 'scroll', sc.join('x'), errs.length ? errs.join(' | ') : 'ok');
    await p.close();
  }
  await b.close();
})();
