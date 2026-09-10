#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const assetsDir = path.join(root, "assets");
const contract = readJson(path.join(assetsDir, "club-identity-v2-1-runtime-descriptor-contract.json"));
const inventory = readJson(path.join(assetsDir, "club-identity-v2-1-authoring-inventory.json"));

const catalogFiles = [
  "club-identity-v2-1-premier-league-descriptors.draft.json",
  "club-identity-v2-1-laliga-descriptors.draft.json",
  "club-identity-v2-1-bundesliga-descriptors.draft.json",
  "club-identity-v2-1-serie-a-descriptors.draft.json",
  "club-identity-v2-1-ligue-1-descriptors.draft.json"
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}
function fail(message) { throw new Error(message); }
function hasOwn(object, key) { return Object.prototype.hasOwnProperty.call(object, key); }
function strings(value, out = []) {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach(item => strings(item, out));
  else if (value && typeof value === "object") Object.values(value).forEach(item => strings(item, out));
  return out;
}
function assertHex(value, club, field) {
  if (!/^#[0-9a-f]{6}$/i.test(String(value || ""))) fail(`${club}: ${field} must be six-digit hex.`);
}
function expectedForLeague(league) {
  if (/Premier League/i.test(league)) return inventory.leagues?.["Premier League"] || [];
  if (/LaLiga/i.test(league)) return inventory.leagues?.LaLiga || [];
  if (/Bundesliga/i.test(league)) return inventory.leagues?.Bundesliga || [];
  if (/Serie A/i.test(league)) return inventory.leagues?.["Serie A"] || [];
  if (/Ligue 1/i.test(league)) return inventory.leagues?.["Ligue 1"] || [];
  return [];
}

const requested = process.argv.slice(2);
const files = requested.length && !requested.includes("--all")
  ? requested.map(value => path.resolve(value))
  : catalogFiles.map(name => path.join(assetsDir, name));

const required = contract.requiredDescriptorFields || [];
const forbidden = new Set(contract.forbiddenRuntimeFields || []);
const enumFields = ["silhouetteFamily","fieldLayout","centerDevice","monogramStyle","borderSystem","textureLanguage","heritageAccent","placeAccent"];
const globalClubs = new Map();
const globalSignatures = new Map();
const results = [];

for (const filePath of files) {
  const catalog = readJson(filePath);
  if (catalog.rendererVersion !== contract.rendererVersion) fail(`${path.basename(filePath)}: rendererVersion mismatch.`);
  if (catalog.networkRequired !== false) fail(`${path.basename(filePath)}: networkRequired must be false.`);
  if (catalog.firebaseRequired !== false) fail(`${path.basename(filePath)}: firebaseRequired must be false.`);
  if (catalog.persisted !== false) fail(`${path.basename(filePath)}: persisted must be false.`);
  if (!catalog.descriptors || typeof catalog.descriptors !== "object" || Array.isArray(catalog.descriptors)) fail(`${path.basename(filePath)}: descriptors must be object.`);

  const names = Object.keys(catalog.descriptors);
  if (Number(catalog.clubCount) !== names.length) fail(`${path.basename(filePath)}: clubCount mismatch.`);
  const expected = expectedForLeague(String(catalog.league || ""));
  if (!expected.length) fail(`${path.basename(filePath)}: unknown league.`);
  const missing = expected.filter(name => !hasOwn(catalog.descriptors, name));
  const unexpected = names.filter(name => !expected.includes(name));
  if (missing.length || unexpected.length) fail(`${path.basename(filePath)}: canonical club mismatch; missing=[${missing.join(", ")}], unexpected=[${unexpected.join(", ")}].`);

  const localSignatures = new Set();
  for (const [club, descriptor] of Object.entries(catalog.descriptors)) {
    if (globalClubs.has(club)) fail(`${club}: appears in multiple league catalogs.`);
    globalClubs.set(club, path.basename(filePath));
    for (const field of required) {
      if (!hasOwn(descriptor, field) || descriptor[field] === null || descriptor[field] === "") fail(`${club}: missing/empty ${field}.`);
    }
    for (const field of forbidden) if (hasOwn(descriptor, field)) fail(`${club}: forbidden runtime field ${field} leaked into descriptor.`);
    assertHex(descriptor.primary, club, "primary");
    assertHex(descriptor.secondary, club, "secondary");
    assertHex(descriptor.accent, club, "accent");
    for (const field of enumFields) {
      const allowed = contract.allowedFamilies?.[field];
      if (!Array.isArray(allowed) || !allowed.includes(descriptor[field])) fail(`${club}: ${field}=${descriptor[field]} is outside contract.`);
    }
    const expectedSignature = [
      descriptor.silhouetteFamily, descriptor.outerContourVariant, descriptor.fieldLayout, descriptor.fieldVariant,
      descriptor.centerDevice, descriptor.centerDeviceVariant, descriptor.monogramStyle, descriptor.borderSystem,
      descriptor.textureLanguage, descriptor.heritageAccent, descriptor.placeAccent
    ].join("|");
    if (descriptor.visualSignature !== expectedSignature) fail(`${club}: visualSignature is not normalized from descriptor fields.`);
    if (localSignatures.has(descriptor.visualSignature)) fail(`${club}: duplicate signature inside ${catalog.league}.`);
    localSignatures.add(descriptor.visualSignature);
    if (globalSignatures.has(descriptor.visualSignature)) fail(`${club}: global signature duplicates ${globalSignatures.get(descriptor.visualSignature)}.`);
    globalSignatures.set(descriptor.visualSignature, club);
    const badRef = strings(descriptor).find(value => /(?:https?:)?\/\//i.test(value) || /^data:/i.test(value));
    if (badRef) fail(`${club}: descriptor contains external/data resource reference.`);
  }
  results.push({file:path.basename(filePath),league:catalog.league,clubCount:names.length,uniqueVisualSignatures:localSignatures.size,status:"PASS"});
}

if (files.length === catalogFiles.length) {
  const allExpected = Object.values(inventory.leagues || {}).flat();
  if (allExpected.length !== 98) fail(`Inventory expected 98 supported clubs, found ${allExpected.length}.`);
  if (globalClubs.size !== 98) fail(`Aggregate descriptor count must be 98, found ${globalClubs.size}.`);
  const missingGlobal = allExpected.filter(name => !globalClubs.has(name));
  if (missingGlobal.length) fail(`Aggregate catalog missing: ${missingGlobal.join(", ")}`);
  if (globalSignatures.size !== 98) fail(`Aggregate unique signature count must be 98, found ${globalSignatures.size}.`);
}

console.log(JSON.stringify({
  rendererVersion: contract.rendererVersion,
  validatedFiles: results,
  aggregateClubCount: globalClubs.size,
  aggregateUniqueVisualSignatures: globalSignatures.size,
  networkRequired: false,
  firebaseRequired: false,
  persisted: false,
  forbiddenRuntimeFieldLeak: false,
  externalResourceReference: false,
  status: "PASS"
}, null, 2));
