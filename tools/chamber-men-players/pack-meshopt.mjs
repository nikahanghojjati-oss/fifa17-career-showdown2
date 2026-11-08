// r90 M1 (MOTION hunt): meshopt-packs the Chamber Men GLBs in place (players, clips, ball, big stadium), so a first open
// downloads about 45% less. Lossless for positions, UVs, joints, weights and key times; normals go to 8-bit and rotations
// to 16-bit (the EXT_meshopt_compression filters), nothing a frame shows. Node names, extras (cmHipsScale, cmRows) and
// materials stay as they are; the scene loads the files with js/chamberMenScene3d.js MESHOPT_JS (meshoptimizer's decoder).
// Run once after convert2.cjs or gen_bowl.py writes a file (a packed file is skipped):
//   npm i --no-save @gltf-transform/core@4.5.1 @gltf-transform/extensions@4.5.1 @gltf-transform/functions@4.5.1 meshoptimizer@0.22.0
//   node tools/chamber-men-players/pack-meshopt.mjs visual-assets/v10_1/chamber-men/players/*.glb visual-assets/v10_1/chamber-men/assets/*.glb
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS,EXTMeshoptCompression} from '@gltf-transform/extensions';
import {reorder} from '@gltf-transform/functions';
import {MeshoptEncoder,MeshoptDecoder} from 'meshoptimizer';
import fs from 'node:fs';

await MeshoptEncoder.ready;await MeshoptDecoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
for(const file of process.argv.slice(2)){
  const before=fs.statSync(file).size,doc=await io.read(file);
  if(doc.getRoot().listExtensionsUsed().some(e=>e.extensionName==='EXT_meshopt_compression')){console.log(`${file}: already packed`);continue;}
  // FILTER keeps float positions (no quantize step, so no node or bind matrix changes; a mesh taken out of its scene keeps
  // its size: the ball).
  await doc.transform(reorder({encoder:MeshoptEncoder,target:'size'}));
  doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({method:EXTMeshoptCompression.EncoderMethod.FILTER});
  await io.write(file,doc);
  console.log(`${file}: ${before} -> ${fs.statSync(file).size}`);
}
