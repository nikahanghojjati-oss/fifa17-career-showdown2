const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "../..");
const source = fs.readFileSync(path.join(root, "js/footballVisuals.js"), "utf8");
let requests = 0;

class FakeImage {
    set src(url){
        this.requestedUrl = url;
        const attempt = ++requests;
        queueMicrotask(() => {
            if(attempt === 1){
                this.onerror();
            }else{
                this.naturalWidth = 1200;
                this.naturalHeight = 800;
                this.onload();
            }
        });
    }
}

const sandbox = {
    Image: FakeImage,
    document: { querySelector: () => ({ content: "test-revision" }) },
    window: { FOOTBALL_VISUALS: { hero: { id: "hero-photo", src: "/photos/hero.png" } } },
    Promise,
    console
};
vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: "footballVisuals.js" });
const load = () => sandbox.window.preloadFootballVisualAssets(["hero"]);

(async () => {
    await assert.rejects(load(), /Required football photograph failed to preload: hero-photo/,
        "the first photo request should report its transient failure");
    assert.equal(requests, 1, "one image should have been requested on the first visit");
    assert.equal(sandbox.window.getFootballVisualDiagnostics().preloadCount, 0,
        "a failed photo must not remain in the preload cache");

    const retry = await load();
    assert.equal(requests, 2, "the next visit must fetch the previously failed photo again");
    assert.equal(retry.length, 1);
    assert.equal(retry[0].id, "hero-photo");
    assert.equal(retry[0].width, 1200);
    assert.equal(retry[0].height, 800);

    await load();
    assert.equal(requests, 2, "a successfully loaded photo must stay cached");
    assert.equal(sandbox.window.getFootballVisualDiagnostics().preloadCount, 1);

    console.log("PASS football photo retry contracts: transient failures retry and successful loads stay cached.");
})().catch(error => { console.error(error); process.exitCode = 1; });
