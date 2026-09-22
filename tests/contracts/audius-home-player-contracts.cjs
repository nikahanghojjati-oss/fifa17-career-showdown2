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

const expectedTracks=[
  ["audius","XNN7jYJ","WHAT YOU GOT","Valentino Khan & NITTI"],
  ["snowglobe","X9wlA0b","SNOW GLOBE","Hadji Gaviota"],
  ["nasty","G5rXAWE","NASTY","grouptherapy."],
  ["alwaysright","9QRXKw","I'M ALWAYS RIGHT","The Holdup"]
];
for(const [key,id,title,artist] of expectedTracks){
  assert.match(menu,new RegExp(`key:"${key}"[\\s\\S]{0,90}trackId:"${id}"`),`Audius-only soundtrack catalog is missing ${key}.`);
  assert.ok(menu.includes(`selectorTitle:"${title}"`),`Audius selector is missing ${title}.`);
  assert.ok(menu.includes(`selectorMeta:"${artist}"`),`Audius selector is missing ${artist}.`);
}
assert.doesNotMatch(menu,/youtube|youtu\.be|videoId|iframeTitle|GAMEPLAY TRAILER|PLAY TRAILER|PAUSE TRAILER/i,"YouTube/trailer runtime must be removed from the Audius-only Home player.");
assert.doesNotMatch(html,/YOUTUBE|GAMEPLAY TRAILER|FIFA 17 VIDEO/i,"Static Home media must no longer advertise YouTube or gameplay trailer content.");
assert.match(html,/aria-label="Audius soundtrack player"/);
assert.match(html,/class="menuMusicSource">AUDIUS</);
assert.match(menu,/aria-label","Choose Audius soundtrack"/);
assert.match(menu,/void activateSelectedAudius\(\)/,"Audius must mount as the main Home player after the initial shell.");
assert.match(menu,/ensureAudiusPlayerModule/,"Audius must enter through the existing optional-module boundary.");
assert.match(optional,/loadRuntimeScript\("audius-player","js\/audiusPlayer\.js"/,"Audius runtime must remain dynamically loaded.");
assert.doesNotMatch(html,/js\/audiusPlayer\.js|css\/audius-player\.css/,"Audius assets must not join the protected initial shell.");
for(const id of ["menuMusicPlayer","menuMusicToggle","menuMusicMute"]){
  assert.strictEqual((html.match(new RegExp(`id="${id}"`,"g"))||[]).length,1,`Audius must reuse the one existing #${id} control.`);
}
assert.doesNotMatch(player,/createElement\(["']button["']\)/,"Lazy Audius module must not create a second Play/Mute control set.");
assert.match(player,/https:\/\/api\.audius\.co\/v1/,"Audius runtime must use the public Audius API origin.");
assert.match(player,/\/stream/,"Audius runtime must use the Audius track stream surface.");
assert.match(player,/app_name=/,"Public Audius requests must identify Career Mode Showdown without embedding a secret.");
assert.doesNotMatch(player,/Bearer\s+[A-Za-z0-9._-]+|api[_-]?secret|client[_-]?secret/i,"Browser Audius integration must never contain a bearer token or secret.");
assert.doesNotMatch(player,/\.autoplay\s*=|autoplay=["']/i,"Audius playback must remain user initiated.");
assert.match(player,/audio\.preload="none"/,"Audius audio must remain preload=none.");
for(const api of ["activate","toggle","toggleMute","syncControls","isPlaying","destroy"]){
  assert.ok(player.includes(api),`Audius lazy module is missing ${api}.`);
}
assert.match(player,/data-audius-player-style/,"Audius stylesheet must be injected by the lazy module.");
assert.match(css,/\.menuMusicTile\[data-media-provider="audius"\]/,"Audius styling must decorate the existing Home soundtrack card.");
assert.match(css,/#menuMusicToggle/,"Audius styling must target the existing Play control.");
assert.match(css,/#menuMusicMute/,"Audius styling must target the existing Mute control.");
assert.match(css,/@media\(max-width:480px\)[\s\S]*min-height:44px/,"Phone Audius controls must retain 44px touch targets.");

const initialRefs=[...html.matchAll(/(?:src|href)="((?:js|css|data)\/[^"?#]+)(?:\?v=[^"#]+)?"/g)].map(match=>match[1]);
assert.strictEqual(initialRefs.filter(file=>file.startsWith("js/")).length,7,"Audius must not increase the seven-script initial shell.");
assert.deepStrictEqual(initialRefs.filter(file=>file.startsWith("css/")),["css/app.css"],"Audius must not add an eager stylesheet.");

console.log("PASS R9 Audius-only Home player contracts: YouTube/trailer paths are removed; the one existing Home soundtrack card mounts a four-track Audius catalog, stays secret-free and no-autoplay, preserves the protected initial shell, and reuses the existing Play/Mute controls.");
