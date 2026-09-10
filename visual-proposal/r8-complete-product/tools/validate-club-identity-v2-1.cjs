#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const contractPath = path.join(root, "assets", "club-identity-v2-1-runtime-descriptor-contract.json");
const inventoryPath = path.join(root, "assets", "club-identity-v2-1-authoring-inventory.json");
const defaultDescriptorPath = path.join(root, "assets", "club-identity-v2-1-premier-league-descriptors.draft.json");
const descriptorPath = path.resolve(process.argv[2] || defaultDescriptorPath);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function fail(message) {
  throw new Error(message);
}

function collectStrings(value, output = []) {
  if (typeof value === "string") {
    output.push(value);
    return output;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, output);
    return output;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectStrings(item, output);
  }
  return output;
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function assertHexColor(value, clubName, field) {
  if (!/^#[0-9a-f]{6}$/i.test(String(value || ""))) {
    fail(`${clubName}: ${field} must be a six-digit hex color.`);
  }
}

const contract = readJson(contractPath);
const inventory = readJson(inventoryPath);
const catalog = readJson(descriptorPath);

if (catalog.rendererVersion !== contract.rendererVersion) {
  fail(`Renderer version mismatch: catalog=${catalog.rendererVersion} contract=${contract.rendererVersion}`);
}
if (catalog.networkRequired !== false) fail("Catalog must explicitly require no network.");
if (catalog.firebaseRequired !== false) fail("Catalog must explicitly require no Firebase.");
if (catalog.persisted !== false) fail("Catalog must explicitly be non-persisted presentation data.");
if (!catalog.descriptors || typeof catalog.descriptors !== "object" || Array.isArray(catalog.descriptors)) {
  fail("Catalog descriptors must be an object keyed by canonical club name.");
}

const clubNames = Object.keys(catalog.descriptors);
if (Number(catalog.clubCount) !== clubNames.length) {
  fail(`clubCount=${catalog.clubCount} but descriptor object contains ${clubNames.length} clubs.`);
}

let expectedClubNames = [];
if (/Premier League/i.test(String(catalog.league || ""))) {
  expectedClubNames = inventory.leagues?.["Premier League"] || [];
} else if (/LaLiga/i.test(String(catalog.league || ""))) {
  expectedClubNames = inventory.leagues?.LaLiga || [];
} else if (/Bundesliga/i.test(String(catalog.league || ""))) {
  expectedClubNames = inventory.leagues?.Bundesliga || [];
} else if (/Serie A/i.test(String(catalog.league || ""))) {
  expectedClubNames = inventory.leagues?.["Serie A"] || [];
} else if (/Ligue 1/i.test(String(catalog.league || ""))) {
  expectedClubNames = inventory.leagues?.["Ligue 1"] || [];
}

if (expectedClubNames.length) {
  const missing = expectedClubNames.filter(name => !hasOwn(catalog.descriptors, name));
  const unexpected = clubNames.filter(name => !expectedClubNames.includes(name));
  if (missing.length) fail(`Missing canonical clubs: ${missing.join(", ")}`);
  if (unexpected.length) fail(`Unexpected club keys: ${unexpected.join(", ")}`);
}

const allowed = contract.allowedFamilies || {};
const signatures = new Map();
const requiredFields = contract.requiredDescriptorFields || [];
const forbiddenFields = new Set(contract.forbiddenRuntimeFields || []);
const enumFields = [
  "silhouetteFamily",
  "fieldLayout",
  "centerDevice",
  "monogramStyle",
  "borderSystem",
  "textureLanguage",
  "heritageAccent",
  "placeAccent"
];

for (const [clubName, descriptor] of Object.entries(catalog.descriptors)) {
  if (!descriptor || typeof descriptor !== "object" || Array.isArray(descriptor)) {
    fail(`${clubName}: descriptor must be an object.`);
  }

  for (const field of requiredFields) {
    if (!hasOwn(descriptor, field)) fail(`${clubName}: missing required descriptor field ${field}.`);
    if (descriptor[field] === null || descriptor[field] === "") fail(`${clubName}: descriptor field ${field} is empty.`);
  }

  for (const forbidden of forbiddenFields) {
    if (hasOwn(descriptor, forbidden)) {
      fail(`${clubName}: forbidden authoring/runtime field ${forbidden} leaked into descriptor.`);
    }
  }

  assertHexColor(descriptor.primary, clubName, "primary");
  assertHexColor(descriptor.secondary, clubName, "secondary");
  assertHexColor(descriptor.accent, clubName, "accent");

  for (const field of enumFields) {
    const values = allowed[field];
    if (!Array.isArray(values) || !values.includes(descriptor[field])) {
      fail(`${clubName}: ${field}=${descriptor[field]} is outside the runtime contract.`);
    }
  }

  const signature = descriptor.visualSignature;
  if (signatures.has(signature)) {
    fail(`${clubName}: duplicate visualSignature with ${signatures.get(signature)}.`);
  }
  signatures.set(signature, clubName);

  const strings = collectStrings(descriptor);
  const externalRef = strings.find(value => /(?:https?:)?\/\//i.test(value) || /^data:/i.test(value));
  if (externalRef) {
    fail(`${clubName}: descriptor contains an external/data resource reference: ${externalRef}`);
  }
}

const signatureCount = signatures.size;
if (signatureCount !== clubNames.length) {
  fail(`Unique signature count ${signatureCount} does not match club count ${clubNames.length}.`);
}

const result = {
  descriptorPath: path.relative(root, descriptorPath),
  rendererVersion: catalog.rendererVersion,
  league: catalog.league || null,
  clubCount: clubNames.length,
  uniqueVisualSignatures: signatureCount,
  networkRequired: catalog.networkRequired,
  firebaseRequired: catalog.firebaseRequired,
  persisted: catalog.persisted,
  forbiddenRuntimeFieldLeak: false,
  externalResourceReference: false,
  status: "PASS"
};

console.log(JSON.stringify(result, null, 2));
