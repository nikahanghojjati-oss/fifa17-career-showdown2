#!/usr/bin/env node
// Sol SQ-1-01 (r87): the 3D roulette scene's squads.json must carry the same launch XI and 4 subs as
// data/rosterSquads.js (the generated source of truth). Run after scripts/build-fifa17-rosters.py.
// Keeps each club's league and kit; rewrites only xi/subs as [position, name, overall].
"use strict";
const fs=require("fs"),path=require("path");
const ROOT=path.resolve(__dirname,"..");
const FILE=path.join(ROOT,"visual-assets/v10_1/roulette/assets/squads.json");
const {squads}=require(path.join(ROOT,"data/rosterSquads.js"));
const scene=JSON.parse(fs.readFileSync(FILE,"utf8"));
const row=([position,name,,overall])=>[position,name,overall];
let changed=0;
for(const club of scene.clubs){
  const squad=squads[club.club];
  if(!squad)throw new Error(`no generated squad for ${club.club}`);
  const xi=squad.xi.map(row),subs=squad.subs.map(row);
  if(JSON.stringify(xi)!==JSON.stringify(club.xi)||JSON.stringify(subs)!==JSON.stringify(club.subs))changed+=1;
  club.xi=xi;club.subs=subs;
}
const missing=Object.keys(squads).filter(name=>!scene.clubs.some(c=>c.club===name));
if(missing.length)throw new Error(`scene asset lacks clubs: ${missing.join(", ")}`);
fs.writeFileSync(FILE,JSON.stringify(scene));
console.log(`squads.json synced: ${changed} of ${scene.clubs.length} clubs changed`);
