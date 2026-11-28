const fs = require("fs"); const path = require("path");
const L = require("./lib.cjs"); const { SCREENS } = require("./screens.cjs");
const OUT = L.S + "/r75-gallery/shots";
const EXTRA_SIZES = ["desktop-1920x1080", "phone-393x660"];
const sizeKeys = (process.env.GAL_SIZES || Object.keys(L.SIZES).join(",")).split(",");
const onlySlugs = process.env.GAL_ONLY ? process.env.GAL_ONLY.split(",") : null;
const manifestPath = L.S + "/r75-gal-tools/manifest.json";
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : { shots: [], failures: [] };
fs.mkdirSync(OUT, { recursive: true });

async function shoot(page, host, name, meta, settleOpts = {}) {
    await L.settle(page, host, settleOpts);
    const diag = await L.diagnose(page, host);
    const file = path.join(OUT, name + ".jpg");
    const png = path.join(L.S, "r75-gal-tools", "png", name + ".png");
    fs.mkdirSync(path.dirname(png), { recursive: true });
    await page.screenshot({ path: png, type: "png", animations: "disabled", fullPage: false });
    require("child_process").execFileSync("python3", ["-I", path.join(__dirname, "convert.py"), png, file, process.env.GAL_Q || "80"]);
    fs.unlinkSync(png);
    if (meta.extra) { // an extra that renders exactly like its base picture adds nothing: drop it
        const baseFile = path.join(OUT, `${meta.slug}-${meta.size}.jpg`);
        const h = f => require("crypto").createHash("sha1").update(fs.readFileSync(f)).digest("hex");
        if (fs.existsSync(baseFile) && h(baseFile) === h(file)) { fs.unlinkSync(file); manifest.shots = manifest.shots.filter(s => s.file !== name + ".jpg"); console.log("shot", name, "IDENTICAL to base, dropped"); return; }
    }
    manifest.shots = manifest.shots.filter(s => s.file !== name + ".jpg");
    manifest.shots.push({ ...meta, file: name + ".jpg", bytes: fs.statSync(file).size, diag });
    console.log("shot", name, fs.statSync(file).size, diag.hOverflowPage ? "HOVERFLOW" : "", diag.scrollers.join("|"), diag.offscreen.length ? "OFFSCREEN " + diag.offscreen.join("|") : "", diag.clipped.length ? "CLIPPED " + diag.clipped.join("|") : "", diag.brokenImgs.length ? "BROKEN " + diag.brokenImgs : "");
}

async function runScreen(browser, sc, sizeKey) {
    const log = [];
    const withExtras = EXTRA_SIZES.includes(sizeKey);
    const base = `${sc.slug}-${sizeKey}`;
    const meta = { slug: sc.slug, title: sc.title, size: sizeKey, sizeLabel: L.SIZES[sizeKey].label };
    let ctx;
    try {
        if (sc.custom) {
            const { page, context } = await L.newPage(browser, sizeKey, log, { raw: true });
            ctx = context;
            await L.prepareTransfer(page, { managerRole: "playerOne", saveId: "gallery_save" });
            // Replay the three missed phases (ordered replay), as the harness does, then go live.
            for (let i = 0; i < 3; i++) { await L.settle(page, "transferChallenge"); await page.evaluate(() => document.getElementById("continueFromTransfers").click()); await page.waitForTimeout(700); }
            const setPhase = async phase => { await page.evaluate(p => window.__transferAudit.setPhase(p), phase); await page.waitForFunction(p => ({ WINDOW_OPEN: "window", GUESS_ENTRY: "guess_entry", SIGNING_ENTRY: "signing_entry", COMPLETED: "completed" }[p] === document.getElementById("transferChallenge").dataset.transferPhase), phase, { timeout: 8000 }); await page.waitForTimeout(1500); };
            await setPhase("WINDOW_OPEN");
            await shoot(page, "transferChallenge", base, { ...meta, caption: "Live transfer window" });
            if (withExtras) {
                for (const [phase, slug, label] of [["GUESS_ENTRY", "guess-entry", "Guess entry (live)"], ["SIGNING_ENTRY", "signing-entry", "Signing entry (live)"], ["COMPLETED", "verdicts", "Verdicts (completed)"]]) {
                    await setPhase(phase);
                    await shoot(page, "transferChallenge", `${sc.slug}--${slug}-${sizeKey}`, { ...meta, extra: slug, caption: label });
                }
            }
        } else {
            const { page, context } = await L.newPage(browser, sizeKey, log);
            ctx = context;
            await sc.open(page);
            await shoot(page, sc.host, base, { ...meta, caption: null }, { requireContent: sc.content });
            if (withExtras && sc.extras) {
                for (const ex of sc.extras) {
                    if ((await ex.act(page)) === false) { console.log("  extra not applicable", base, ex.slug); continue; }
                    await page.waitForTimeout(500);
                    await shoot(page, sc.host, `${sc.slug}--${ex.slug}-${sizeKey}`, { ...meta, extra: ex.slug, caption: ex.label });
                }
            }
        }
        if (log.length) { console.log("  log:", log.slice(0, 4)); manifest.shots.filter(s => s.slug === sc.slug && s.size === sizeKey).forEach(s => s.log = log.slice(0, 6)); }
        return true;
    } catch (e) {
        console.log("  FAILED", base, e.message.split("\n")[0].slice(0, 300));
        manifest.failures = manifest.failures.filter(f => f.id !== base); manifest.failures.push({ id: base, slug: sc.slug, size: sizeKey, error: e.message.split("\n")[0].slice(0, 300), log: log.slice(0, 5) });
        return false;
    } finally { if (ctx) await ctx.close().catch(() => { }); }
}

(async () => {
    const browser = await L.launch();
    for (const sizeKey of sizeKeys) {
        for (const sc of SCREENS) {
            if (onlySlugs && !onlySlugs.includes(sc.slug)) continue;
            let ok = await runScreen(browser, sc, sizeKey);
            if (!ok) ok = await runScreen(browser, sc, sizeKey);
            if (ok) manifest.failures = manifest.failures.filter(f => f.id !== `${sc.slug}-${sizeKey}`);
            fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 1));
        }
    }
    await browser.close();
    const total = manifest.shots.reduce((n, s) => n + s.bytes, 0);
    console.log("TOTAL", manifest.shots.length, "shots", (total / 1048576).toFixed(2), "MB; failures", manifest.failures.length);
})();
