#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const assetsDir = path.join(root, "assets");
const contract = readJson(path.join(assetsDir, "club-identity-v2-1-runtime-descriptor-contract.json"));
const inventory = readJson(path.join(assetsDir, "club-identity-v2-1-authoring-inventory.json"));
const overridePath = path.join(assetsDir, "club-identity-v2-1-r2-overrides.draft.json");
const overrideCatalog = fs.existsSync(overridePath) ? readJson(overridePath) : {overrides:{}};

const catalogFiles = [
  "club-identity-v2-1-premier-league-descriptors.draft.json",
  "club-identity-v2-1-laliga-descriptors.draft.json",
  "club-identity-v2-1-bundesliga-descriptors.draft.json",
  "club-identity-v2-1-serie-a-descriptors.draft.json",
  "club-identity-v2-1-ligue-1-descriptors.draft.json"
];

function readJson(filePath) { return JSON.parse(fs.readFileSync(filePath, "utf8")); }
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

if (overrideCatalog.rendererVersion && overrideCatalog.rendererVersion !== contract.rendererVersion) fail("R2 override rendererVersion mismatch.");
if (overrideCatalog.networkRequired === true) fail("R2 overrides may not require network.");
if (overrideCatalog.firebaseRequired === true) fail("R2 overrides may not require Firebase.");
if (overrideCatalog.persisted === true) fail("R2 overrides may not be persisted.");
const overrides = overrideCatalog.overrides || {};

const requested = process.argv.slice(2);
const files = requested.length && !requested.includes("--all")
  ? requested.map(value => path.resolve(value))
  : catalogFiles.map(name => path.join(assetsDir, name));

const required = contract.requiredDescriptorFields || [];
const forbidden = new Set(contract.forbiddenRuntimeFields || []);
const enumFields = ["silhouetteFamily","fieldLayout","centerDevice","monogramStyle","borderSystem","textureLanguage","heritageAccent","placeAccent"];
const globalClubs = new Map();
const globalSignatures = new Map();
const appliedOverrides = new Set();
const results = [];

function validateDescriptor(club, descriptor) {
  if (!descriptor || typeof descriptor !== "object" || Array.isArray(descriptor)) fail(`${club}: descriptor must be object.`);
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
  const normalized = [
    descriptor.silhouetteFamily, descriptor.outerContourVariant, descriptor.fieldLayout, descriptor.fieldVariant,
    descriptor.centerDevice, descriptor.centerDeviceVariant, descriptor.monogramStyle, descriptor.borderSystem,
    descriptor.textureLanguage, descriptor.heritageAccent, descriptor.placeAccent
  ].join("|");
  if (descriptor.visualSignature !== normalized) fail(`${club}: visualSignature is not normalized from descriptor fields.`);
  const badRef = strings(descriptor).find(value => /(?:https?:)?\/\//i.test(value) || /^data:/i.test(value) || /firebase|firestore|storagePath|officialCrestUrl/i.test(value));
  if (badRef) fail(`${club}: descriptor contains external/runtime resource reference.`);
  return normalized;
}

for (const filePath of files) {
  const catalog = readJson(filePath);
  if (catalog.rendererVersion !== contract.rendererVersion) fail(`${path.basename(filePath)}: rendererVersion mismatch.`);
  if (catalog.networkRequired !== false) fail(`${path.basename(filePath)}: networkRequired must be false.`);
  if (catalog.firebaseRequired !== false) fail(`${path.basename(filePath)}: firebaseRequired must be false.`);
  if (catalog.persisted !== false) fail(`${path.basename(filePath)}: persisted must be false.`);
  if (!catalog.descriptors || typeof catalog.descriptors !== "object" || Array.isArray(catalog.descriptors)) fail(`${path.basename(filePath)}: descriptors must be object.`);

  const rawNames = Object.keys(catalog.descriptors);
  if (Number(catalog.clubCount) !== rawNames.length) fail(`${path.basename(filePath)}: clubCount mismatch.`);
  const expected = expectedForLeague(String(catalog.league || ""));
  if (!expected.length) fail(`${path.basename(filePath)}: unknown league.`);
  const missing = expected.filter(name => !hasOwn(catalog.descriptors, name));
  const unexpected = rawNames.filter(name => !expected.includes(name));
  if (missing.length || unexpected.length) fail(`${path.basename(filePath)}: canonical club mismatch; missing=[${missing.join(", ")}], unexpected=[${unexpected.join(", ")}].`);

  const effective = {...catalog.descriptors};
  for (const club of expected) {
    if (hasOwn(overrides, club)) {
      effective[club] = overrides[club];
      appliedOverrides.add(club);
    }
  }

  const localSignatures = new Set();
  for (const [club, descriptor] of Object.entries(effective)) {
    if (globalClubs.has(club)) fail(`${club}: appears in multiple league catalogs.`);
    globalClubs.set(club, path.basename(filePath));
    const signature = validateDescriptor(club, descriptor);
    if (localSignatures.has(signature)) fail(`${club}: duplicate signature inside ${catalog.league}.`);
    localSignatures.add(signature);
    if (globalSignatures.has(signature)) fail(`${club}: global signature duplicates ${globalSignatures.get(signature)}.`);
    globalSignatures.set(signature, club);
  }
  results.push({file:path.basename(filePath),league:catalog.league,clubCount:rawNames.length,uniqueVisualSignatures:localSignatures.size,r2OverridesApplied:expected.filter(name=>appliedOverrides.has(name)).length,status:"PASS"});
}

if (files.length === catalogFiles.length) {
  const allExpected = Object.values(inventory.leagues || {}).flat();
  if (allExpected.length !== 98) fail(`Inventory expected 98 supported clubs, found ${allExpected.length}.`);
  if (globalClubs.size !== 98) fail(`Aggregate descriptor count must be 98, found ${globalClubs.size}.`);
  const missingGlobal = allExpected.filter(name => !globalClubs.has(name));
  if (missingGlobal.length) fail(`Aggregate catalog missing: ${missingGlobal.join(", ")}`);
  if (globalSignatures.size !== 98) fail(`Aggregate unique signature count must be 98, found ${globalSignatures.size}.`);
  const orphanOverrides = Object.keys(overrides).filter(name => !appliedOverrides.has(name));
  if (orphanOverrides.length) fail(`R2 overrides do not match supported catalog clubs: ${orphanOverrides.join(", ")}`);
}

console.log(JSON.stringify({
  rendererVersion: contract.rendererVersion,
  validatedFiles: results,
  aggregateClubCount: globalClubs.size,
  aggregateUniqueVisualSignatures: globalSignatures.size,
  r2OverridesAvailable: Object.keys(overrides).length,
  r2OverridesApplied: appliedOverrides.size,
  networkRequired: false,
  firebaseRequired: false,
  persisted: false,
  forbiddenRuntimeFieldLeak: false,
  externalResourceReference: false,
  status: "PASS"
}, null, 2));
