#!/usr/bin/env node
"use strict";
// P3 Emerald League Roulette (Nik 2026-11-26): the League half of p3-emerald-own-art-contracts.cjs at the light and medium tiers, run as its own
// contract so each part stays inside the POS10 census's 120 s limit per file (the combined file timed out in CI on 26 Nov).
// With 3D on (WebGL through SwiftShader), on desktop, 2x desktop, upright and sideways phone, the League screen shows the 3D
// roulette board on Emerald's marble and never the old flat wheel. The checks themselves live in the own-art file; p3-emerald-league-3d-high-contracts.cjs
// covers the other two tiers.
process.env.P3_EMERALD_PHASE = "league";
process.env.P3_EMERALD_TIERS = "light,medium";
require("./p3-emerald-own-art-contracts.cjs");
