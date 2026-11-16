import * as THREE from 'three';
import { sculptureMarble } from './baroque-materials.js';

async function loadPackedGeometry(url){
  const response=await fetch(url);if(!response.ok)throw Error('雕塑模型未能读取：'+url);
  const data=await response.arrayBuffer(),header=new DataView(data);
  if(header.getUint32(0,true)!==0x4553554d)throw Error('雕塑模型格式不正确');
  const vertices=header.getUint32(8,true),indices=header.getUint32(12,true),geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(data,16,vertices*3),3));
  geometry.setAttribute('normal',new THREE.BufferAttribute(new Float32Array(data,16+vertices*12,vertices*3),3));
  geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(data,16+vertices*24,indices),1));geometry.computeBoundingBox();geometry.computeBoundingSphere();return geometry;
}
export async function loadSculptureAssets(){const [muse,figural,glassAtlas,fresco,madonna,gabriel,putto,saintCharles]=await Promise.all([loadPackedGeometry('./assets/sculptures/muse.bin'),loadPackedGeometry('./assets/sculptures/figural-relief.bin'),new THREE.TextureLoader().loadAsync('./assets/cathedral-glass-atlas-v3.png'),new THREE.TextureLoader().loadAsync('./assets/cathedral-vault-fresco-v1.png'),loadPackedGeometry('./assets/sculptures/madonna.bin'),loadPackedGeometry('./assets/sculptures/gabriel.bin'),loadPackedGeometry('./assets/sculptures/putto.bin'),new THREE.TextureLoader().loadAsync('./assets/saint-charles-relief.png')]);glassAtlas.colorSpace=THREE.SRGBColorSpace;glassAtlas.anisotropy=4;fresco.colorSpace=THREE.SRGBColorSpace;fresco.anisotropy=8;saintCharles.colorSpace=THREE.SRGBColorSpace;return{muse,figural,glassAtlas,fresco,madonna,gabriel,putto,saintCharles};}

export function addCentralMuse({C,hall,foundation,geometry,gold,registerStructure,length}){
  const group=new THREE.Group();group.name='central-muse';hall.add(group);
  const marble=sculptureMarble();
  const mesh=new THREE.Mesh(geometry,marble);mesh.name='terpsichore-muse-scan';mesh.scale.setScalar(C.hall.museHeight);mesh.position.y=1.65;mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);
  const stone=sculptureMarble();
  for(const [r,h,y] of[[3.70,.20,.10],[3.38,.20,.30],[3.04,1.04,.92],[3.38,.20,1.54]]){const base=new THREE.Mesh(new THREE.CylinderGeometry(r*1.2,(r+.04)*1.2,h,64),stone);base.position.y=y;group.add(base);}
  for(const [r,y] of[[3.37,.41],[3.37,1.65]]){const ring=new THREE.Mesh(new THREE.TorusGeometry(r*1.2,.015,5,96),gold);ring.rotation.x=Math.PI/2;ring.position.y=y;group.add(ring);}
  group.userData.navigationRadius=C.hall.museClearance;
  const contactCanvas=document.createElement('canvas');contactCanvas.width=contactCanvas.height=128;const ctx=contactCanvas.getContext('2d'),gradient=ctx.createRadialGradient(64,64,22,64,64,64);gradient.addColorStop(0,'#000000a0');gradient.addColorStop(1,'#00000000');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);
  const contact=new THREE.Mesh(new THREE.PlaneGeometry(14,14),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(contactCanvas),transparent:true,depthWrite:false}));contact.rotation.x=-Math.PI/2;contact.position.y=.031;foundation.add(contact);
  registerStructure(group,{trigger:length-15,duration:3.7,kind:'muse-statue'});
  // A gentle entrance-side fill keeps the face readable against the front light.
  const fill=new THREE.SpotLight(0xffebd0,140,48,.55,.8,1.6);fill.position.set(-8,16,18);fill.target.position.set(0,10,0);hall.add(fill,fill.target);
}

export { addToledoReliefs as addVaultReliefs } from './toledo-sanctuary.js';
