"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

class Element {
    constructor(tag){
        this.tagName = tag;
        this.children = [];
        this.handlers = {};
        this.disabled = false;
        this.textContent = "";
        this.classList = { add(){}, remove(){} };
    }
    append(...children){ this.children.push(...children); }
    appendChild(child){ this.children.push(child); return child; }
    replaceChildren(...children){ this.children = children; }
    get childElementCount(){ return this.children.length; }
    setAttribute(){}
    removeAttribute(){}
    addEventListener(type, handler){ this.handlers[type] = handler; }
    querySelector(){ return null; }
    focus(){}
}

async function check(){
    const controls = new Element("div");
    const document = {
        createElement: tag => new Element(tag),
        querySelector: selector => selector === "#legacy .legacyDataControls" ? controls : null
    };
    const sandbox = { window: {}, document, TextEncoder, Blob, structuredClone };
    vm.createContext(sandbox);
    vm.runInContext(
        fs.readFileSync(path.resolve(__dirname, "../../js/importAnalysis.js"), "utf8"),
        sandbox,
        { filename: "js/importAnalysis.js" }
    );
    sandbox.window.mountCareerModeImportAnalysisPanel();

    const panel = controls.children[0];
    const input = panel.children[4];
    const fileState = panel.children[5];
    const [analyze, clear] = panel.children[6].children;
    const status = panel.children[7];
    const result = panel.children[8];

    let finishOld;
    const oldFile = {
        name: "older.json", size: 50,
        text: () => new Promise(resolve => { finishOld = resolve; })
    };
    const newFile = { name: "newer.json", size: 40, text: async () => "{invalid JSON" };

    input.files = [oldFile];
    input.handlers.change();
    const oldAnalysis = analyze.handlers.click();
    assert.equal(typeof finishOld, "function", "first backup is being read");

    input.files = [newFile];
    input.handlers.change();
    assert.match(fileState.textContent, /newer\.json/);
    assert.equal(analyze.disabled, true, "cannot tap Analyze until the previous read settles");
    finishOld("{invalid JSON");
    await oldAnalysis;

    assert.equal(result.childElementCount, 0, "old backup must not display its result under the new filename");
    assert.match(status.textContent, /File selected/, "new backup retains its own selection status");
    assert.equal(analyze.disabled, false, "new backup becomes analyzable after the old read");

    await analyze.handlers.click();
    assert.ok(result.childElementCount > 0, "new backup is analyzed on its own tap");
    assert.match(status.textContent, /blocking problems/, "invalid new backup is reported as blocked");

    let finishCleared;
    const clearFile = {
        name: "clear-me.json", size: 50,
        text: () => new Promise(resolve => { finishCleared = resolve; })
    };
    input.files = [clearFile];
    input.handlers.change();
    const oldAfterClear = analyze.handlers.click();
    clear.handlers.click();
    finishCleared("{invalid JSON");
    await oldAfterClear;

    assert.equal(result.childElementCount, 0, "clearing during analysis stays cleared");
    assert.equal(analyze.disabled, true, "cleared selection remains disabled");
    assert.match(fileState.textContent, /No file selected/);
    console.log("PASS import analysis preserves the currently selected backup across slow reads and clear");
}

check().catch(error => { console.error(error); process.exitCode = 1; });
