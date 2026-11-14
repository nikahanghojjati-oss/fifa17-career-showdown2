// JOB-1647: hold app startup at DOMContentLoaded and compare first-paint loading
// against the later r3/r2/offline sheets at every approved viewport.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { resolveChromiumRuntime } = require('../support/chromium-runtime.cjs');
const sizes = [[360,640],[375,553],[393,660],[390,844],[430,932],[740,360],
    [844,390],[768,1024],[820,1180],[1180,820],[1363,936],[1366,768],[1280,800],[1920,866],[1920,1035],[1920,1080]];
const baseUrl = new URL(process.env.CMS_BASE_URL || 'http://127.0.0.1:4173/');
const out = path.resolve(process.env.CMS_TEST_RESULTS || 'test-results/loading-first-paint');
const labels = ['#loadingText', '.startupPhotoCredit', '.startupSaveNote', '.startupIdentity'];
// HO-072: the cover is Team V's tunnel room with the Reus cut-out in front; the title (V3 logo lettering), tagline, status
// line and credit are live on top. Reus's face box, as a share of his layer (the same on the desktop and phone cut-outs).
const FACE = [.44, .025, .68, .23];

async function inspect(page) {
    return page.evaluate(([selectors, face]) => {
        const loader = document.querySelector('#loadingScreen');
        const rects = selectors.map(selector => {
            const element = document.querySelector(selector);
            const rect = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            return { selector, x:rect.x, y:rect.y, width:rect.width, height:rect.height,
                right:rect.right, bottom:rect.bottom, color:style.color, font:style.font,
                visible:style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 40 && rect.height > 8,
                fits:rect.x >= 0 && rect.y >= 0 && rect.right <= innerWidth+.5 && rect.bottom <= innerHeight+.5 };
        });
        // Nothing covers anything: no two labels overlap, and none of them touches Reus's face, which is whole on screen.
        const r = document.getElementById('startupAthlete').getBoundingClientRect();
        const f = { left:r.left + face[0] * r.width, top:r.top + face[1] * r.height, right:r.left + face[2] * r.width, bottom:r.top + face[3] * r.height };
        const apart = (a, b) => a.right <= b.left || a.x >= b.right || a.bottom <= b.top || a.y >= b.bottom;
        for (const rect of rects) rect.clear = apart(rect, f) && rects.every(other => other === rect || apart(rect, { left:other.x, top:other.y, right:other.right, bottom:other.bottom }));
        rects.push({ selector:'Reus face', x:f.left, y:f.top, width:f.right - f.left, height:f.bottom - f.top, right:f.right, bottom:f.bottom,
            visible:f.right - f.left > 30, fits:f.left >= -.5 && f.top >= -.5 && f.right <= innerWidth+.5 && f.bottom <= innerHeight+.5 });
        const room = document.querySelector('.startupAthleteFrame').getBoundingClientRect();
        return { rects, bars:room.left > .5 || room.top > .5 || room.right < innerWidth-.5 || room.bottom < innerHeight-.5,
            scroll:loader.scrollHeight > innerHeight || loader.scrollWidth > innerWidth,
            animations:document.getAnimations().filter(animation => loader.contains(animation.effect?.target)).length };
    }, [labels, FACE]);
}

async function settle(page) {
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

(async () => {
    fs.mkdirSync(out, { recursive:true });
    const runtime = await resolveChromiumRuntime();
    const browser = await chromium.launch({ headless:true, ...runtime,
        args:runtime.args.filter(argument => argument !== '--single-process') });
    const report = [];
    try {
        for (const [width,height] of sizes) {
            const context = await browser.newContext({ viewport:{width,height} });
            const page = await context.newPage();
            try {
                // Fonts and artwork are local. No external services are needed by this presentation audit.
                await page.route('https://**/*', route => route.abort());
                await page.addInitScript(() => {
                    const add = document.addEventListener.bind(document);
                    document.addEventListener = (event,listener,options) => {
                        if (event !== 'DOMContentLoaded') add(event,listener,options);
                    };
                });
                let release;
                const held = new Promise(resolve => { release = resolve; });
                await page.route('**/css/visual-fidelity-r3.css*', async route => {
                    await held;
                    await route.continue();
                });
                await page.goto(baseUrl.href, { waitUntil:'domcontentloaded' });
                await page.waitForFunction(() => [...document.querySelectorAll('#loadingScreen img')].every(image => image.complete && image.naturalWidth > 0));
                await page.evaluate(async () => {
                    await document.fonts.ready;
                    // Decode any loader background art before recording the artwork.
                    for (const selector of ['#loadingScreen']) {
                        const style = getComputedStyle(document.querySelector(selector), selector === '#loadingScreen' ? '::before' : null);
                        for (const match of style.backgroundImage.matchAll(/url\("?([^"\)]+)"?\)/g)) {
                            const image = new Image();
                            image.src = match[1];
                            await image.decode();
                        }
                    }
                });
                const first = await inspect(page);
                await page.screenshot({ path:path.join(out, `${width}x${height}-first.png`) });
                release();
                await page.waitForFunction(() => document.querySelector('link[data-visual-fidelity]')?.sheet);
                for (const sheet of ['css/visual-fidelity-r3.css', 'css/offline.css']) {
                    await page.addStyleTag({ url:new URL(sheet,baseUrl).href });
                }
                await page.evaluate(() => document.fonts.ready);
                const late = await inspect(page);
                for (const rect of late.rects) assert.ok(rect.visible && rect.fits && rect.clear !== false, `${width}x${height} ${JSON.stringify(rect)}`);
                assert.equal(late.scroll, false, `${width}x${height}: no loader scrolling`);
                assert.equal(late.bars, false, `${width}x${height}: the room fills the window (no bars)`);
                assert.deepEqual(late.rects, first.rects, `${width}x${height}: later CSS cannot restyle the loader`);
                await page.screenshot({ path:path.join(out, `${width}x${height}.png`) });
                await page.emulateMedia({ reducedMotion:'reduce' });
                await settle(page);
                assert.equal((await inspect(page)).animations, 0, 'device reduced motion');
                await page.emulateMedia({ reducedMotion:'no-preference' });
                // Use the app setting so its media-query lifecycle cannot reset a synthetic attribute.
                await page.evaluate(() => window.setApplicationReducedMotionPreference(true));
                await settle(page);
                assert.equal((await inspect(page)).animations, 0, 'app reduced motion');
                report.push({width,height,first,late});
                console.log(`PASS loading first paint ${width}x${height}: title, labels and Reus's face visible and apart, room fills the window, stable later CSS, both reduced-motion modes`);
            } finally {
                await context.close();
            }
        }
    } finally {
        await browser.close();
    }
    fs.writeFileSync(path.join(out,'geometry.json'), JSON.stringify(report,null,2));
    console.log(`PASS loading first-paint audit: ${sizes.length}/${sizes.length} viewports`);
})().catch(error => { console.error(error); process.exitCode = 1; });
