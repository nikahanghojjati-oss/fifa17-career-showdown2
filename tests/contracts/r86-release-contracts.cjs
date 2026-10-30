'use strict';
// r86 release (1.9.10-r86) items from the red team (2026-10-29): the Special Player starts at the release, the Rules go live
// before the site, and the retained r85 shell is checked against r85's own list.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ROOT=path.resolve(__dirname,'../..');
const read=file=>fs.readFileSync(path.join(ROOT,file),'utf8');
let checks=0;const ok=(id,label)=>{checks+=1;console.log(`ok ${checks} ${id} ${label}`);};

// RR1 (red team #3): MARQUEE_FROM_MS is the r86 release time, not the 2026-10-28 build date. Showdowns confirmed before it
// (all of them played on r85) get no Special Player; a later one always does.
{
  const source=read('js/marqueePlayer.js'),MP=require('../../js/marqueePlayer.js');
  const literal=/const MARQUEE_FROM_MS=Date\.parse\("(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)"\);/.exec(source);
  assert.ok(literal,'MARQUEE_FROM_MS is one fixed UTC time');
  assert.equal(MP.fromMs,Date.parse(literal[1]));
  assert.ok(MP.fromMs>=Date.parse('2026-10-30T00:00:00Z'),'MARQUEE_FROM_MS is the r86 release time');
  ok('RR1','the Special Player starts at the r86 release time');
}

// RR2 (red team #4): the site waits for this commit's Rules deploy and is not deployed when that deploy fails.
{
  const pages=read('.github/workflows/deploy-github-pages.yml');
  assert.match(pages,/\n  rules-first:\n/);
  assert.match(pages,/\n  build:\n    needs: rules-first\n/,'the site build waits for rules-first');
  assert.match(pages,/actions\/workflows\/deploy-firestore-rules-zero-billing\.yml\/runs\?head_sha=\$SHA&event=push/);
  assert.match(pages,/"\$conclusion" == "success"[^\n]*exit 0/);
  assert.match(pages,/the site is not deployed ahead of its Rules\."\n\s+exit 1/);
  assert.ok(fs.existsSync(path.join(ROOT,'.github/workflows/deploy-firestore-rules-zero-billing.yml')));
  // r87: a push without a Rules change ships the site only after the last Rules deploy on main succeeded.
  assert.match(pages,/runs\?branch=main&event=push&status=completed&per_page=1/);
  assert.match(pages,/"\$last" == "success" \|\| "\$last" == "none"[^\n]*exit 0/);
  assert.match(pages,/Re-run it first; the site is not deployed ahead of its Rules\."\n\s+exit 1/);
  ok('RR2','the site deploy waits for the same commit\'s Rules deploy, or for the last one on main to have succeeded');
}

// RR3 (red team #5): PREVIOUS is r85, so the rollback list is r86's shell minus exactly the six files r86 adds.
{
  const sw=read('service-worker.js');
  assert.match(sw,/const RUNTIME_REVISION = "1\.9\.10-r86";\nconst PREVIOUS_RUNTIME_REVISION = "1\.9\.9-r85";/);
  const added=JSON.parse('['+/const SHELL_PATHS_ADDED_SINCE_PREVIOUS = new Set\(\[([^\]]*)\]\);/.exec(sw)[1]+']');
  // r87 (until 2.0.0 moves PREVIOUS to r86) appends its own twelve shell files after r86's six.
  assert.deepEqual(added.slice(0,6),['js/careerSummaryStore.js','js/specialPlayerReveal.js','visual-assets/v10_1/special-player/index.html','js/marqueePlayer.js','data/marqueePlayers.js','js/specialPlayerChip.js']);
  assert.deepEqual(added.slice(6),['js/rosterRouletteStep.js','js/rosterRoulette.js','data/rosterSquads.js','css/v10Roulette.css','visual-assets/v10_1/roulette/index.html','visual-assets/v10_1/roulette/platemap.json','visual-assets/v10_1/roulette/vendor/three-r128.min.js','visual-assets/v10_1/roulette/vendor/THREE_LICENSE.txt','visual-assets/v10_1/roulette/assets/squads.json','js/deadlineDay.js','data/deadlineDayLines.js','data/fifa17Players.js']);
  assert.ok(!added.includes('js/musicDockV10.js'),'the r85 music player is in r85\'s own list');
  const shell=JSON.parse(/const SHELL_PATHS\s*=\s*Object\.freeze\((\[[\s\S]*?\])\);/.exec(sw)[1]);
  assert.equal(shell.length,240); // r86 228 + r87's twelve
  assert.ok(added.every(p=>shell.includes(p)));
  assert.equal(shell.filter(p=>!added.includes(p)).length,222,'r85 rollback shell is unchanged');
  ok('RR3','the retained r85 shell is verified against its own 222 paths');
}

console.log(`PASS r86 release contracts: ${checks} checks.`);
