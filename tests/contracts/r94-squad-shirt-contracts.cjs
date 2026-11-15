"use strict";
/* R94-01 (Nik 2026-11-15, plain kits on Squad Management): a shirt that could not be painted is never kept for the session,
   its stand-in wears the club's own kit colour (never one red shirt for every club), and the screen tries again. */
const assert=require("assert"),fs=require("fs"),path=require("path");
const sq=fs.readFileSync(path.join(__dirname,"..","..","js/squadScreen.js"),"utf8");
assert.ok(/if\(url\)shirtCache\.set\(key,url\);else shirtMissed=true;/.test(sq),"S1 a failed shirt is never cached");
assert.ok(/function standInColour\(club,role,vsClub\)/.test(sq)&&/box\.style\.background=body/.test(sq),"S2 the stand-in wears the club's kit colour");
assert.ok(/const RETRY_MS=\[1500,4000,10000,20000\]/.test(sq)&&/if\(drag\)\{retryShirts\(n\);return;\}/.test(sq)&&/retryShirts\(0\);/.test(sq),"S3 retried a few times, never mid-drag");
console.log("PASS r94 squad shirt contracts (3 checks)");
