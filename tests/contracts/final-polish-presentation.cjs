const fs = require('node:fs');
const zlib = require('node:zlib');
const assert = require('node:assert');

const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('css/app.css', 'utf8');
const app = fs.readFileSync('js/app.js', 'utf8');
const screens = fs.readFileSync('js/screens.js', 'utf8');
const settings = fs.readFileSync('js/settings.js', 'utf8');
const transferSelector = fs.readFileSync('js/transferSelector.js', 'utf8');
const feedbackBytes = fs.statSync('js/menuFeedback.js').size;

const buttons = [...html.matchAll(/<button\b[^>]*>/gi)].map(match => match[0]);
assert.deepStrictEqual(buttons.filter(button => !/\btype="button"/i.test(button)), [], 'Every shell button must declare button type.');
for(const id of ['showdownName', 'managerOne', 'managerTwo', 'roundAmount']){
  assert.ok(html.includes(`for="${id}"`), `${id} needs an associated setup label.`);
}
const transferFields = [...html.matchAll(/<(?:input|select)\b[^>]*data-transfer-field[^>]*>/gi)].map(match => match[0]);
assert.ok(transferFields.length >= 30, 'Transfer field shell is incomplete.');
assert.deepStrictEqual(transferFields.filter(field => !/\baria-label=/i.test(field)), [], 'Every compact Transfer field needs a contextual accessible name.');
assert.ok(transferSelector.includes('selectorContextLabel'), 'Enhanced Transfer comboboxes must preserve contextual labels.');
assert.ok(html.includes('id="selectedLeague" role="status" aria-live="polite"'), 'League result must be announced.');
assert.ok(screens.includes('setAttribute("aria-hidden"'), 'Route commits must synchronize the accessibility tree.');
assert.ok(screens.includes('heading.setAttribute("tabindex", "-1")'), 'Route headings must be programmatically focusable.');
assert.ok(screens.includes('heading.focus({ preventScroll: true })'), 'Route focus must avoid viewport jumps.');
assert.ok(settings.includes('setAttribute("role", "switch")'), 'Feedback preference needs native switch semantics.');
assert.ok(css.includes('.backButton:focus-visible') && css.includes('.menuMusicControl:focus-visible'), 'Primary non-tile controls need explicit focus visibility.');
const clubRevealIndex = (css.match(/\.clubRevealIndex\{[^}]+\}/) || [])[0] || '';
assert.ok(clubRevealIndex.includes('color:rgba(255,255,255,.66)'), 'Club reveal sequence indices must retain readable contrast.');
assert.ok(css.includes('.transferOverviewStatus{color:#596873;}'), 'Showdown Home transfer status must retain readable contrast.');
assert.ok(css.includes('.overallScoreBox span{color:#52616b'), 'Season Summary overall-score caption must retain readable contrast.');

const forward = (css.match(/@keyframes routeForwardIn\{([^}]*(?:\}[^@]*)?)/) || [])[0] || '';
const back = (css.match(/@keyframes routeBackIn\{([^}]*(?:\}[^@]*)?)/) || [])[0] || '';
assert.ok(forward.includes('translate3d') && back.includes('translate3d'), 'Route movement must stay compositor-friendly.');
assert.ok(!/(?:top|left|width|height|margin|padding):/.test(forward + back), 'Route keyframes must not animate layout properties.');
assert.ok(!/opacity:/.test(forward + back), 'Content-bearing route surfaces must preserve full opacity throughout entrance motion.');
assert.ok(css.includes('.screen[data-route-state="entering"]{will-change:transform;'), 'Route presentation must promote only the transform layer.');
assert.ok(css.includes('html[data-motion-reduced="true"] .screen[data-route-state="entering"]'), 'User reduced motion must explicitly disable route theatrics.');
assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'), 'Device reduced motion guard is missing.');

const appVersion = (app.match(/const APP_VERSION = "([^"]+)"/) || [])[1];
const revision = (html.match(/app-asset-revision"\s+content="([^"]+)/) || [])[1];
assert.ok(appVersion, 'APP_VERSION is missing.');
assert.strictEqual(revision, `${appVersion}-r1`, 'Final Polish cache revision must track APP_VERSION.');
const refs = [...html.matchAll(/(?:src|href)="((?:js|css|data)\/[^"?#]+)(?:\?v=([^"#]+))?/g)]
  .map(match => ({ path: match[1], revision: match[2] || '' }));
assert.strictEqual(refs.filter(ref => ref.path.startsWith('js/')).length, 7, 'Initial shell must remain seven scripts.');
assert.deepStrictEqual(refs.filter(ref => ref.path.startsWith('css/')).map(ref => ref.path), ['css/app.css']);
assert.deepStrictEqual(refs.filter(ref => ref.revision !== revision), [], 'Final polish shell contains mixed revisions.');
const rawBytes = refs.reduce((total, ref) => total + fs.statSync(ref.path).size, 0);
const compressedBytes = refs.reduce((total, ref) => total + zlib.gzipSync(fs.readFileSync(ref.path), { level: 9 }).length, 0);
if(rawBytes > 165000 || compressedBytes > 37500){
  console.log(`::error file=index.html,title=Protected startup budget exceeded::${rawBytes} raw / ${compressedBytes} gzip; limits are 165000 / 37500.`);
}
assert.ok(rawBytes <= 165000, `Initial raw bytes exceeded 165000 (${rawBytes}).`);
assert.ok(compressedBytes <= 37500, `Initial compressed bytes exceeded 37500 (${compressedBytes}).`);
assert.ok(feedbackBytes <= 5500, `Lazy feedback module is too large (${feedbackBytes}).`);
console.log(`Accessibility and presentation budgets passed for ${revision}: ${rawBytes} raw / ${compressedBytes} compressed initial bytes; ${feedbackBytes} lazy feedback bytes.`);
