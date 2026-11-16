"use strict";
/* R94-01 (Nik 2026-11-15, plain kits on Squad Management): a shirt that could not be painted is never kept for the session,
   its stand-in wears the club's own kit colour (never one red shirt for every club), and the screen tries again. */
const assert=require("assert"),fs=require("fs"),path=require("path");
const sq=fs.readFileSync(path.join(__dirname,"..","..","js/squadScreen.js"),"utf8");
assert.ok(/if\(url\)shirtCache\.set\(key,url\);else shirtMissed=true;/.test(sq),"S1 a failed shirt is never cached");
assert.ok(/function standInColour\(club,role,vsClub\)/.test(sq)&&/box\.style\.background=body/.test(sq),"S2 the stand-in wears the club's kit colour");
assert.ok(/const RETRY_MS=\[1500,4000,10000,20000\]/.test(sq)&&/if\(drag\)\{retryShirts\(n\);return;\}/.test(sq)&&/retryShirts\(0\);/.test(sq),"S3 retried a few times, never mid-drag");
assert.ok(/repaintStandIns\(host\);retryShirts\(n\+1\);/.test(sq)&&!/shirtMissed=false;sqmRender\(\);retryShirts/.test(sq)&&/scope\.querySelectorAll\("\.sqmShirt\.is-plain"\)/.test(sq),"S3b a retry repaints only the stand-ins, in place (focus and caret kept)");
// S4 (Nik 2026-11-15 "Both"): every one-colour kit is painted with 2016-17 detailing from its own colours (tonal fabric, trim side
// panels, double cuff), so no solid shirt reads as a plain template.
const vm=require("vm"),kitsSrc=fs.readFileSync(path.join(__dirname,"..","..","js/kits17.js"),"utf8"),ctx={console};ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);vm.runInContext(kitsSrc,ctx);
assert.ok(/else if\(k\.pattern==="solid"\)solidDetail\(g,W,H,k,X,Y\);/.test(kitsSrc),"S4 solid kits get their detailing");
assert.ok(/if\(k\.pattern==="solid"&&!k\.sleeves\)\{g\.fillStyle=k\.trim;g\.fillRect\(0,H\*\.84,W,H\*\.035\);\}/.test(kitsSrc),"S4 solid kits get a double cuff");
const solid=ctx.CareerModeKits17.clubs.filter(c=>ctx.CareerModeKits17.kit(c).pattern==="solid");
assert.ok(solid.length>=40,"S4 the solid kits are found");
console.log("PASS r94 squad shirt contracts (5 checks, "+solid.length+" detailed one-colour kits)");
