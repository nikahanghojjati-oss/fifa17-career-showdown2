"use strict";
// r89 Kits 17 (Nik 2026-11-04): every club has its 2016-17 home kit, and a keeper kit that never clashes with either outfield kit.
const assert=require("assert");
const fs=require("fs"),path=require("path");
const K=require(path.join(__dirname,"../../js/kits17.js"));
const src=fs.readFileSync(path.join(__dirname,"../../data/clubs.js"),"utf8");
const clubs=Object.values(eval("("+src.match(/const clubsByLeague = (\{[\s\S]*?\n\});/)[1]+")")).flat();
assert.strictEqual(clubs.length,98,"98 clubs in the game");
for(const c of clubs){const k=K.kit(c);assert.ok(k.known,`${c} has a kit`);for(const f of ["body","trim","shorts","socks","sockTop","dominant"])assert.match(k[f],/^#[0-9a-f]{6}$/i,`${c} ${f}`);}
let worst=Infinity;for(const a of clubs)for(const b of clubs){const g=K.keeperKit(a,b);worst=Math.min(worst,g.clearance);}
assert.ok(worst>=45,`every keeper is at least 45 (CIE76) from both outfield kits, worst ${worst}`);
assert.strictEqual(K.layout.uv,"wrap");
console.log(`r89 kits17 contracts: PASS (98 clubs, worst keeper clearance ${worst})`);
