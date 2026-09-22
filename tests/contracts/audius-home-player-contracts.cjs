"use strict";

const fs=require("node:fs");
const path=require("node:path");
const assert=require("node:assert/strict");

const root=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");

const html=read("index.html");
const menu=read("js/menuExperience.js");
const optional=read("js/optionalModules.js");
const player=read("js/audiusPlayer.js");
const css=read("css/audius-player.css");

assert.match(menu,/key:"audius",type:"music",trackId:"XNN7jYJ"/,"Home media catalog must expose the bounded Audius track source.");
assert.match(menu,/selectorTitle:"WHAT YOU GOT"/);
assert.match(menu,/Valentino Khan & NITTI/);
assert.match(menu,/ensureAudiusPlayerModule/,"Audius must enter through the existing optional-module boundary.");
assert.match(optional,/loadRuntimeScript\("audius-player","js\/audiusPlayer\.js"/,"Audius runtime must be lazy loaded.");
assert.doesNotMatch(html,/js\/audiusPlayer\.js|css\/audius-player\.css/,"Audius assets must not join the protected initial shell.");
for(const id of ["menuMusicPlayer","menuMusicToggle","menuMusicMute"]){
  assert.strictEqual((html.match(new RegExp(`id="${id}"`,"g"))||[]).length,1,`Audius must reuse the one existing #${id} control.`);
}
assert.doesNotMatch(player,/createElement\(["']button["']\)/,"Lazy Audius module must not create a second Play/Mute control set.");
assert.match(player,/https:\/\/api\.audius\.co\/v1/,"Audius runtime must use the public read-only API origin.");
assert.match(player,/tracks\/.*\/stream|\/stream/,"Audius runtime must use the official track stream surface.");
assert.match(player,/app_name=/,"Public Audius requests must identify Career Mode Showdown without embedding a secret.");
assert.doesNotMatch(player,/Bearer\s+[A-Za-z0-9._-]+|api[_-]?secret|client[_-]?secret/i,"Browser Audius integration must never contain a bearer token or secret.");
assert.doesNotMatch(player,/\.autoplay\s*=|autoplay=["']/i,"Audius playback must remain user initiated.");
assert.match(player,/preload="none"|preload="none"|audio\.preload="none"/,"Audius audio must stay unloaded until the player is activated.");
for(const api of ["activate","toggle","toggleMute","syncControls","isPlaying","destroy"]){
  assert.ok(player.includes(api),`Audius lazy module is missing ${api}.`);
}
assert.match(player,/data-audius-player-style/,"Audius stylesheet must be injected by the lazy module.");
assert.match(css,/\.menuMusicTile\[data-media-provider="audius"\]/,"Audius styling must decorate the existing Home media card.");
assert.match(css,/#menuMusicToggle/,"Audius styling must target the existing Play control.");
assert.match(css,/#menuMusicMute/,"Audius styling must target the existing Mute control.");
assert.match(css,/@media\(max-width:480px\)[\s\S]*min-height:44px/,"Phone Audius controls must retain 44px touch targets.");

const initialRefs=[...html.matchAll(/(?:src|href)="((?:js|css|data)\/[^"?#]+)(?:\?v=[^"#]+)?"/g)].map(match=>match[1]);
assert.strictEqual(initialRefs.filter(file=>file.startsWith("js/")).length,7,"Audius must not increase the seven-script initial shell.");
assert.deepStrictEqual(initialRefs.filter(file=>file.startsWith("css/")),["css/app.css"],"Audius must not add an eager stylesheet.");

console.log("PASS R9 Audius Home player contracts: one existing Home media surface gains a secret-free, no-autoplay, lazy Audius stream source without increasing initial script/style count or duplicating Play/Mute controls.");
