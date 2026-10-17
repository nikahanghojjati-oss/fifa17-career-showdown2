// JOB-1647: hold app startup at DOMContentLoaded and compare first-paint loading
// against the later r3/r2/offline sheets at every approved viewport.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { resolveChromiumRuntime } = require('../support/chromium-runtime.cjs');
const sizes = [[360,640],[375,553],[393,660],[390,844],[430,932],[740,360],
    [844,390],[768,1024],[820,1180],[1366,768],[1280,800],[1920,1080]];
const baseUrl = new URL(process.env.CMS_BASE_URL || 'http://127.0.0.1:4173/');
const out = path.resolve(process.env.CMS_TEST_RESULTS || 'test-results/loading-first-paint');
const labels = ['#loadingText', '.startupPhotoCredit', '.startupSaveNote'];
// HO-030 v3: the title block (roundel, kicker, wordmark, edition) is baked into both Loading pictures. Its box in
// picture pixels (alpha bounds of Team V's identity overlays) is mapped through object-fit/object-position to the screen.
const BAKED_TITLE = String.raw`(image => {
    const r = image.getBoundingClientRect(), s = getComputedStyle(image), nw = image.naturalWidth, nh = image.naturalHeight;
    const scale = (s.objectFit === "contain" ? Math.min : Math.max)(r.width / nw, r.height / nh), rw = nw * scale, rh = nh * scale;
    const [px, py] = s.objectPosition.split(/\s+/);
    const offset = (value, free) => value.endsWith("%") ? free * parseFloat(value) / 100 : parseFloat(value.replace(/^calc\(/, ""));
    const x0 = r.left + offset(px, r.width - rw), y0 = r.top + offset(py, r.height - rh);
    const b = nw > nh ? [1144/1920, 170/1080, 1827/1920, 658/1080] : [121/1179, 21/2096, 1005/1179, 631/2096];
    return { left:x0 + b[0] * rw, top:y0 + b[1] * rh, right:x0 + b[2] * rw, bottom:y0 + b[3] * rh, width:(b[2] - b[0]) * rw, height:(b[3] - b[1]) * rh };
})`;

async function inspect(page) {
    return page.evaluate(([selectors, bakedTitle]) => {
        const loader = document.querySelector('#loadingScreen');
        const rects = selectors.map(selector => {
            const element = document.querySelector(selector);
            const rect = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            return { selector, x:rect.x, y:rect.y, width:rect.width, height:rect.height,
                right:rect.right, bottom:rect.bottom, color:style.color, font:style.font,
                visible:style.display !== 'none' && style.visibility !== 'hidden',
                fits:rect.x >= 0 && rect.y >= 0 && rect.right <= innerWidth+.5 && rect.bottom <= innerHeight+.5 };
        });
        // The baked title shows in the picture and is never cut: fully inside the screen, and no label covers it.
        const t = (0, eval)(bakedTitle)(document.getElementById('startupAthlete'));
        const title = { selector:'baked title', x:t.left, y:t.top, width:t.width, height:t.height, right:t.right, bottom:t.bottom,
            visible:t.width > 40 && t.height > 20,
            fits:t.left >= -.5 && t.top >= -.5 && t.right <= innerWidth+.5 && t.bottom <= innerHeight+.5,
            clear:rects.every(r => r.right <= t.left || r.x >= t.right || r.bottom <= t.top || r.y >= t.bottom) };
        rects.push(title);
        return { rects, scroll:loader.scrollHeight > innerHeight || loader.scrollWidth > innerWidth,
            animations:document.getAnimations().filter(animation => loader.contains(animation.effect?.target)).length };
    }, [labels, BAKED_TITLE]);
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
                await page.waitForFunction(() => {
                    const image = document.getElementById('startupAthlete');
                    return image.complete && image.naturalWidth > 0;
                });
                await page.evaluate(async () => {
                    await document.fonts.ready;
                    // Decode any loader background art before recording the artwork (the title is in the picture since HO-030 v3).
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
                for (const sheet of ['css/visual-fidelity-r2.css', 'css/offline.css']) {
                    await page.addStyleTag({ url:new URL(sheet,baseUrl).href });
                }
                await page.evaluate(() => document.fonts.ready);
                const late = await inspect(page);
                for (const rect of late.rects) assert.ok(rect.visible && rect.fits && rect.clear !== false, `${width}x${height} ${JSON.stringify(rect)}`);
                assert.equal(late.scroll, false, `${width}x${height}: no loader scrolling`);
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
                console.log(`PASS loading first paint ${width}x${height}: visible labels, no overflow, stable later CSS, both reduced-motion modes`);
            } finally {
                await context.close();
            }
        }
    } finally {
        await browser.close();
    }
    fs.writeFileSync(path.join(out,'geometry.json'), JSON.stringify(report,null,2));
    console.log('PASS loading first-paint audit: 12/12 viewports');
})().catch(error => { console.error(error); process.exitCode = 1; });
