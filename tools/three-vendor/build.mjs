// Rebuild the vendored three.js (run from the repo root):
//   npm i --no-save three@0.187.0 esbuild@0.25.12 && node tools/three-vendor/build.mjs
// Output: visual-assets/v10_1/roulette/vendor/three-r187.min.js (classic script, sets window.THREE). Pin the same versions so the
// bytes match the sha256 the contracts hold.
import { build } from 'esbuild';
import fs from 'node:fs';
const pkg = JSON.parse( fs.readFileSync( new URL( '../../node_modules/three/package.json', import.meta.url ) ) );
if ( pkg.version !== '0.187.0' ) throw new Error( 'expected three 0.187.0, found ' + pkg.version );
await build( {
	entryPoints: [ new URL( './entry.mjs', import.meta.url ).pathname ],
	bundle: true, minify: true, format: 'iife', globalName: 'THREE', target: 'es2019', legalComments: 'none', charset: 'utf8',
	banner: { js: '/* three.js r187 (MIT, see THREE_LICENSE.txt) + EXRLoader, GLTFLoader, EffectComposer, RenderPass, UnrealBloomPass, OutputPass; Career Mode Showdown build, tools/three-vendor */' },
	outfile: 'visual-assets/v10_1/roulette/vendor/three-r187.min.js'
} );
