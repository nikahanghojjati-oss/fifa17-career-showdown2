const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../../js/screens.js"), "utf8");
const makeScreen = initiallyHidden => {
    const classes = new Set(initiallyHidden ? ["hidden"] : []);
    return {
        classList: {
            contains: name => classes.has(name),
            add: name => classes.add(name),
            remove: name => classes.delete(name)
        },
        setAttribute(){},
        querySelector(){ return null; }
    };
};
const nodes = {
    mainMenu: makeScreen(false),
    createShowdown: makeScreen(true)
};
let releasePresentation;
const presentation = new Promise(resolve => { releasePresentation = resolve; });
const sandbox = {
    console,
    currentShowdown: null,
    document: {
        getElementById: name => nodes[name] || null,
        querySelector: () => null
    },
    window: {
        isReducedMotionPreferred: () => true,
        ensureRequiredFootballVisualExperience: () => presentation,
        prepareFootballVisualScreen: () => true
    }
};
vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: "js/screens.js" });

(async () => {
    const oldTap = vm.runInContext(
        'navigateTo("createShowdown", { manageFocus: false })', sandbox
    );
    const newTap = vm.runInContext(
        'navigateTo("mainMenu", { manageFocus: false })', sandbox
    );
    assert.equal(await newTap, true, "newest screen request must succeed");

    releasePresentation();
    assert.equal(await oldTap, false, "overtaken screen request must not reopen an older screen");
    assert.equal(vm.runInContext("getActiveScreenName()", sandbox), "mainMenu",
        "later player tap must remain visible after older loading resolves");
    assert.equal(nodes.createShowdown.classList.contains("hidden"), true);
    console.log("PASS chat audit screens B: late presentation load cannot override newest route.");
})().catch(error => { console.error(error); process.exitCode = 1; });
