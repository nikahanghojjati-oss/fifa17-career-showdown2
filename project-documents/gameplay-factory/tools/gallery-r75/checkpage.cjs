const L = require("./lib.cjs");
(async () => {
    const b = await L.launch();
    for (const w of [390, 1440]) {
        const ctx = await b.newContext({ viewport: { width: w, height: 900 } });
        const p = await ctx.newPage();
        await p.goto("file://" + L.S + "/r75-gallery/index.html");
        await p.evaluate(() => document.querySelectorAll("img").forEach(i => i.loading = "eager"));
        await p.waitForFunction(() => [...document.images].every(i => i.complete), null, { timeout: 30000 });
        const r = await p.evaluate(() => ({ imgs: document.images.length, broken: [...document.images].filter(i => !i.naturalWidth).map(i => i.getAttribute("src")), scrollW: document.documentElement.scrollWidth, title: document.title, h2: [...document.querySelectorAll("h2")].slice(0, 3).map(h => h.textContent) }));
        console.log(w, JSON.stringify(r));
        await p.screenshot({ path: L.S + `/r75-gal-tools/page-${w}.png`, clip: { x: 0, y: 0, width: w, height: 2600 }, fullPage: true });
        await ctx.close();
    }
    await b.close();
})();
