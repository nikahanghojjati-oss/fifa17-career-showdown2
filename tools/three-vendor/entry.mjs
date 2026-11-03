// Career Mode Showdown: the one three.js build both 3D pages load (Roster Russian Roulette and Special Player).
// Built by tools/three-vendor/build.mjs into visual-assets/v10_1/roulette/vendor/three-r187.min.js as a classic script that sets
// window.THREE, so the pages keep loading it with a plain <script src> before their own code (no module loading order to change,
// no CDN, shell-cached by the service worker for offline play). three.js is MIT (vendor/THREE_LICENSE.txt).
// Only the parts the two pages use, so phones download less (the build tree-shakes the rest of three.js away).
import { ShaderChunk } from 'three';
export {
	ACESFilmicToneMapping, AdditiveBlending, AgXToneMapping, AmbientLight, BackSide, Box3, BoxGeometry, BufferAttribute,
	BufferGeometry, CanvasTexture, CatmullRomCurve3, CircleGeometry, ClampToEdgeWrapping, Clock, Color, ColorManagement,
	ConeGeometry, CylinderGeometry, DataTexture, DirectionalLight, DoubleSide, DynamicDrawUsage, EquirectangularReflectionMapping, Euler,
	ExtrudeGeometry, Float32BufferAttribute, FloatType, Fog, FogExp2, Group, HalfFloatType, HemisphereLight,
	InstancedMesh, LatheGeometry, LinearFilter, LinearMipmapLinearFilter, LinearSRGBColorSpace, MathUtils, Matrix4, Mesh,
	MeshBasicMaterial, MeshDepthMaterial, MeshPhysicalMaterial, MeshStandardMaterial, MirroredRepeatWrapping, NearestFilter, NeutralToneMapping, NoColorSpace,
	NoToneMapping, NormalBlending, Object3D, OrthographicCamera, PCFShadowMap, PMREMGenerator, Path, PerspectiveCamera, PlaneGeometry,
	PointLight, Points, PointsMaterial, Quaternion, REVISION, RGBAFormat, Raycaster, RepeatWrapping,
	SRGBColorSpace, Scene, ShaderChunk, ShaderMaterial, Shape, ShapeGeometry, Sphere, SphereGeometry,
	SpotLight, Sprite, SpriteMaterial, Texture, TextureLoader, TorusGeometry, TubeGeometry, UnsignedByteType,
	VSMShadowMap, Vector2, Vector3, Vector4, WebGLRenderTarget, WebGLRenderer
} from 'three';
export { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
export { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
export { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
export { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
export { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

// r89 (engine upgrade from r128): r128 drew both pages with the old light model (renderer.physicallyCorrectLights false). three.js
// removed it in r165. This puts the r128 light maths back in the one shader chunk that holds it, so every light keeps the
// brightness and the reach it was tuned with: every light is PI times brighter than the physical model, and a light with a
// range fades linearly to zero at that range (decay is the curve), a light without a range never fades.
// Call it once, before the first render.
export function cmsLegacyLights() {
	const C = ShaderChunk;
	if ( C.__cmsLegacyLights ) return true;
	let s = C.lights_pars_begin;
	const swaps = [
		[ 'vec3 irradiance = ambientLightColor;', 'vec3 irradiance = ambientLightColor * PI;' ],
		[ 'vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );', 'vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight ) * PI;' ],
		[ 'light.color = directionalLight.color;', 'light.color = directionalLight.color * PI;' ],
		[ 'light.color = pointLight.color;', 'light.color = pointLight.color * PI;' ],
		[ 'light.color = spotLight.color * spotAttenuation;', 'light.color = spotLight.color * spotAttenuation * PI;' ]
	];
	for ( const [ a, b ] of swaps ) {
		if ( s.indexOf( a ) < 0 ) throw new Error( 'cmsLegacyLights: three.js shader chunk changed (' + a + ')' );
		s = s.replace( a, b );
	}
	const fn = /float getDistanceAttenuation\([^)]*\) \{[\s\S]*?\n\}\n/;
	if ( ! fn.test( s ) ) throw new Error( 'cmsLegacyLights: three.js shader chunk changed (getDistanceAttenuation)' );
	s = s.replace( fn, 'float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {\n\tif ( cutoffDistance > 0.0 && decayExponent > 0.0 ) return pow( saturate( - lightDistance / cutoffDistance + 1.0 ), decayExponent );\n\treturn 1.0;\n}\n' );
	C.lights_pars_begin = s;
	C.__cmsLegacyLights = true;
	return true;
}
