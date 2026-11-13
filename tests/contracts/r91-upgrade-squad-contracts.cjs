#!/usr/bin/env node
"use strict";
// M1 (2.4.0 bug hunt, P3): two things after an update from 2.3.0 in the middle of a Showdown.
//   M1-1 the new Squad "pre" screen was asked once for a season whose roulette both managers had already spun on 2.3.0. That
//        season's roulette is settled without squads, so no squad is asked for it. The skip comes from the spin marks the
//        Transfer Challenge read just made (no new read), and only when BOTH marks are whole outcomes saved by a roulette engine
//        before squads (js/rosterRoulette.js ENGINE_REVISION 3 is the first that spins on squads; 2.3.0 is revision 2).
//        A normal 2.4.0 season (no marks yet, or marks spun on squads, or a bare mark) asks as before: no screen is skipped.
//   M1-2 while one phone is still on the old version, the Squad wait said only "Waiting for <name> to lock his squad." It now
//        adds the roulette's own words, "Update the game on <name>'s phone: close it fully and open it again.", when the
//        rival's spin mark for this season was saved before squads (the roulette's signal: the version on his spin mark).
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
let passed=0;const ok=name=>{passed+=1;console.log(`ok ${passed} ${name}`);};

const pstc=read("js/productionSharedTransferChallenge.js"),step=read("js/squadSheetStep.js"),engine=read("js/rosterRoulette.js"),rrs=read("js/rosterRouletteStep.js");

// the engine facts the skip relies on
const revision=Number((engine.match(/const ENGINE_REVISION=(\d+);/)||[])[1]);
assert.ok(revision>=3,"js/rosterRoulette.js: revision 3 or later spins on squad sheets");
assert.match(engine,/return `rr\$\{4\}\.\$\{ENGINE_REVISION\}\.\$\{rrHash\(JSON\.stringify\(parts\)\)\}`;/,"a spin version reads rr4.<revision>.<hash>");
assert.match(engine,/r91: with squad sheets the boards are the sheets/,"revision 3 is the squad-sheet engine");
ok(`the roulette engine is revision ${revision}; versions read rr4.<revision>.<hash>`);

// the helper itself
const helper=(pstc.match(/const PSTC_SQUAD_ROULETTE_REVISION=3;\s*function pstcSpunBeforeSquads\(mark\)\{[^]*?\n  \}/)||[])[0];
assert.ok(helper,"pstcSpunBeforeSquads is there");
const sandbox={};vm.createContext(sandbox);vm.runInContext(`${helper};this.f=pstcSpunBeforeSquads;`,sandbox);
const f=sandbox.f;
assert.equal(f({fired:true,hitName:"A",hitSlot:2,version:"rr4.2.9f3a"}),true,"a 2.3.0 shot");
assert.equal(f({fired:false,version:"rr4.2.0c1d"}),true,"a 2.3.0 empty chamber");
assert.equal(f({fired:true,hitName:"A",hitSlot:2,version:`rr4.${revision}.9f3a`}),false,"a 2.4.0 spin");
assert.equal(f({fired:true,version:"rr4.12.aa"}),false,"a later revision");
for(const bare of [true,null,undefined,{},{version:"rr4.2.x"},{fired:true},{fired:true,version:"v2"},"rr4.2.x"])assert.equal(f(bare),false,`not taken as before squads: ${JSON.stringify(bare)}`);
ok("pstcSpunBeforeSquads: only a whole outcome from revision 1-2 counts");

// M1-1 the skip: after the started-window check, from the marks already read, both managers, before any squad read or screen
const first=(pstc.match(/async function pstcSquadFirst\(request\)\{[^]*?\n  \}\n/)||[])[0];
assert.ok(first,"pstcSquadFirst is there");
const skipAt=first.indexOf('if(marks&&["playerOne","playerTwo"].every(role=>pstcSpunBeforeSquads(marks[role])))return true;');
assert.ok(skipAt>first.indexOf("if(view.state)return true;"),"M1-1 the skip sits after the started-window check");
assert.ok(skipAt>0&&skipAt<first.indexOf("pstcSquadSteps()")&&skipAt<first.indexOf("steps.step.run(ctx,io)"),"M1-1 before any step load, read or screen");
assert.match(first,/const marks=view\.spinMarks;/,"M1-1 the marks come from the read just made");
ok("M1-1 Squad 'pre' is skipped only when both managers' marks were spun before squads");

// M1-2 the hint: the squad context carries it for "pre" only, while the window has not started; the wait prints it
assert.match(pstc,/rivalBehind:stage==="pre"&&!view\.state&&pstcSpunBeforeSquads\(view\.spinMarks\?\.\[rival\]\)/,"M1-2 the rival's mark, pre only");
const wait=(step.match(/say\(`Your squad is locked\. Waiting for \$\{rivalName\} to lock his squad\.[^\n]*\n/)||[])[0]||"";
assert.match(wait,/ctx\.rivalBehind===true\?` Update the game on \$\{rivalName\}'s phone: close it fully and open it again\.`:""/,"M1-2 the wait adds the update line");
assert.match(rrs,/Update the game on \$\{name\}'s phone: close it fully and open it again\./,"M1-2 the same words as the roulette's version stop");
ok("M1-2 the Squad wait asks to update the rival's phone when his spin was saved before squads");

// the order rule: the Squad screen still runs between Chamber Men and the roulette
const openNow=(pstc.match(/async function pstcOpenNow\(\)\{[^\n]*/)||[])[0]||"";
assert.deepEqual([...openNow.matchAll(/await (pstc[A-Za-z]+First)\(request\)/g)].map(m=>m[1]),["pstcChamberMenFirst","pstcSquadFirst","pstcRouletteFirst","pstcPrimePackFirst"],"the screens before the Transfer War, in order");
ok("order: Chamber Men, Squad pre, Russian Roulette, Prime Pack");

console.log(`PASS r91 upgrade Squad contracts (${passed} checks)`);
